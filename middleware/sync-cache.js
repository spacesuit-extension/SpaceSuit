import Subprovider from 'web3-provider-engine/subproviders/subprovider'

/*
 * Workaround for Ether Shrimp Farmer bug - Web3Provider doesn't implement
 * synchronous send, so we implement it for a handful or methods.
 *
 * We also implement aggressive caching of these
 */
export default class SyncCacheSubprovider extends Subprovider {
  constructor(opts = {}) {
    super(opts)
    this.cache = opts.cache || {}
    this.prefix = opts.prefix || '__SpaceSuit_sync_data_cache_'
  }
  handleRequest(payload, next, end) {
    let method = payload.method
    if (method in handlers) {
      let {cachableValues} = handlers[method]
      if (this.prefix + method in this.cache) {
        end(null, JSON.parse(this.cache[this.prefix + method]))
      } else {
        next((err, res, cb) => {
          if (!err) {
            for (let methodName in cachableValues(response)) {
              this.cache[this.prefix + methodName] = cachableValues[methodName]
            }
          }
          cb()
        })
      }
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
          return defaultValue()
        }
      } else if (method === 'eth_uninstallFilter') {
        provider.sendAsync(payload, () => {})
        return reponse(true)
      } else {
        oldSend.call(provider, payload)
      }
    }
  }
}

function response({id, jsonrpc}, result) {
  return {id, jsonrpc, result}
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
