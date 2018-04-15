import Subprovider from 'web3-provider-engine/subproviders/subprovider'


/*
 * Workaround for CryptoKitties bug. It assumes addresses are always lower
 * case, and some invariants get broken if not - it doesn't believe you're
 * logged in, for instance.
 */
export default class LowerCaseAddressesSubprovider extends Subprovider {
  constructor(opts) {
    super(opts)
  }
  handleRequest(payload, next, end) {
    if (payload.method === 'eth_accounts') {
      next((err, result, cb) => {
        if (result != null) {
          for (let i = 0; i < result.length; i++) {
            result[i] = result[i].toLowerCase()
          }
        }
        cb()
      })
    } else next()
  }
}
