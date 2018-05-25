import Subprovider from 'web3-provider-engine/subproviders/subprovider'

/*
 * Workaround for Ether Shrimp Farmer bug - Web3Provider doesn't implement
 * synchronous send, so we cache values for
 */
export default class SyncCacheSubprovider extends Subprovider {
  constructor(opts = {}) {
    super(opts)
    this.cache = opts.cache || {}
    this.prefix = opts.prefix || '__SpaceSuit_sync_data_cache_'
  }
  handleRequest(payload, next, end) {
    switch(payload.method) {
      case 'eth_accounts':
        next((err, result, cb) => {
          if (!err && result && result.length) {
            this.cache[this.prefix + 'accounts'] = JSON.stringify(result)
            this.cache[this.prefix + 'coinbase'] = result[0]
          }
          cb()
        })
        break
      case 'eth_coinbase':
        next((err, result, cb) => {
          if (!err) {
            this.cache[this.prefix + 'coinbase'] = result
          }
          cb()
        })
        break
      case 'net_version':
        next((err, result, cb) => {
          if (!err) {
            this.cache[this.prefix + 'net_version'] = result
          }
          cb()
        })
        break
      default:
        next()
    }
  }

  patchSend(provider) {
    let oldSend = provider.send
    provider.send = (payload) => {
      function result(value) {
        return {
          id: payload.id,
          jsonrpc: payload.jsonrpc,
          result: value
        }
      }
      switch(payload.method) {
        case 'eth_accounts':
          let accountsJson = this.cache[this.prefix + 'accounts']
          if (accountsJson) return result(JSON.parse(accountsJson))
          else {
            provider.sendAsync(payload, () => {}) // Call for side effect of caching
            return result([])
          }
        case 'eth_coinbase':
          let coinbase = this.cache[this.prefix + 'coinbase']
          if (coinbase) return result(coinbase)
          else {
            provider.sendAsync(payload, () => {}) // Call for side effect of caching
            return result(null)
          }
        case 'net_version':
          let netVersion = this.cache[this.prefix + 'net_version']
          if (netVersion != null) return result(netVersion)
          else {
            provider.sendAsync(payload, () => {}) // Call for side effect of caching
            return result(null)
          }
        case 'eth_uninstallFilter':
          provider.sendAsync(payload, () => {})
          return result(true)
        default:
          oldSend.call(provider, payload)
      }
    }
  }
}
