import Subprovider from 'web3-provider-engine/subproviders/subprovider'

/*
 * Workaround for Ether Shrimp Farmer bug - Web3Provider doesn't implement
 * synchronous send, so we implement it for a handful or methods.
 *
 * We also implement aggressive caching of these values to work around a race
 * condition in MakerDAO Dai dashboard.
 */
export default class SyncCacheSubprovider extends Subprovider {
  constructor(opts = {}) {
    super(opts)
    this.cache = opts.cache || {}
    this.lastChanged = opts.lastChanged || 0
    this.prefix = opts.prefix || '__SpaceSuit_sync_data_cache_'
    this.pendingCalls = {}
  }
  handleRequest(payload, next, end) {
    let method = payload.method
    if (method in handlers) {
      let {cachableValues} = handlers[method]
      if (this.prefix + method in this.cache) {
        end(null, JSON.parse(this.cache[this.prefix + method]))
      } else if (method in this.pendingCalls) {
        this.pendingCalls[method].then(
          (res) => end(null, res),
          (err) => end(err)
        )
      } else {
        this.pendingCalls[method] = new Promise((resolve, reject) => {
          next((err, res, cb) => setTimeout(() => {
            delete this.pendingCalls[method]
            if (err) reject(err)
            else {
              resolve(res)
              let cachable = cachableValues(res)
              for (let methodName in cachable) {
                let value = cachable[methodName]
                if (value != null) this.cache[this.prefix + methodName] = JSON.stringify(value)
              }
            }
            cb()
          }, 0))
        })
      }
    } else if (method === 'eth_getBlockByNumber' && payload.params[0] === '0x0' && 'eth_accounts' in this.pendingCalls) {
      /* Hack to workaround https://github.com/makerdao/dai-explorer/issues/25.
       * If there is an outstanding `eth_accounts` request,
       * delay `eth_getBlockByNumber` request for block 0 by up to 10 seconds,
       * so that the `eth_accounts` call wins the race.
       */
       let resumed = false
       function resume () {
         if (!resumed) {
           resumed = true
           next()
         }
       }
       this.pendingCalls.eth_accounts.then(resume, resume)
       setTimeout(resume, 10000)
    } else {
      next()
    }
  }

  patchSend(provider) {
    let oldSend = provider.send
    provider.send = (payload) => {
      let method = payload.method
      if (method in handlers) {
        let {defaultValue, cachableValues} = handlers[method]
        if (this.prefix + method in this.cache) {
          return response(payload, JSON.parse(this.cache[this.prefix + method]))
        } else {
          provider.sendAsync(payload, () => {}) // Call purely for side effect of caching
          return response(payload, defaultValue())
        }
      } else if (method === 'eth_uninstallFilter') {
        provider.sendAsync(payload, () => {})
        return reponse(payload, true)
      } else {
        oldSend.call(provider, payload)
      }
    }
  }

  pollForChanges(coinbaseSubprovider, interval = 90000) {
    let lastPolled = this.cache[this.prefix + 'lastPolled']
    let pollWait = 0
    if (this.lastChanged > lastPolled) {
      // Invalidate cached net version, and request again
      delete this.cache[this.prefix + 'net_version']
      this.emitPayload(request('net_version'), () => {})
    } else {
      pollWait = Math.min(interval, +lastPolled + interval - new Date)
    }
    this.poller = setTimeout(() => {
      this._doPoll(coinbaseSubprovider)
      this.poller = setInterval(() => {
        this._doPoll(coinbaseSubprovider)
      }, interval)
    }, pollWait)
  }

  _doPoll(coinbaseSubprovider) {
    this.cache[this.prefix + 'lastPolled'] = +new Date
    coinbaseSubprovider.handleRequest(request('eth_coinbase'), null, (err, res) => {
      if (res && res !== this.cache[this.prefix + 'eth_coinbase']) {
        delete this.cache[this.prefix + 'eth_coinbase']
        delete this.cache[this.prefix + 'eth_accounts']
        this.emitPayload(request('eth_accounts'), () => {})
      }
    })
  }

  stopPolling() {
    clearInterval(this.poller)
  }
}

function response({id, jsonrpc}, result) {
  return {id, jsonrpc, result}
}

function request(method) {
  return {
    method, params: Array.prototype.slice.call(arguments, 1),
    id: Math.floor(Math.random() * 1000000000000), jsonrpc: '2.0'
  }
}

const handlers = {
  eth_accounts: {
    defaultValue() { return [] },
    cachableValues(result) {
      if (result.length) {
        return {
          eth_accounts: result,
          eth_coinbase: result[0]
        }
      } else {
        return {}
      }
    }
  },
  eth_coinbase: {
    defaultValue() { return null },
    cachableValues(result) {
      return {
        eth_coinbase: result
      }
    }
  },
  net_version: {
    defaultValue() { return null },
    cachableValues(result) {
      return {
        net_version: result
      }
    }
  }
}
