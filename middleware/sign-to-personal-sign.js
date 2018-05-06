import Subprovider from 'web3-provider-engine/subproviders/subprovider'


/*
 * MetaMask implements eth_sign as raw EC signature, which differs from Geth and
 * Parity, which use padded messages in all cases (although they do intend to
 * switch). Ledger's web3 subprovider doesn't implement eth_sign (presumably
 * because it would not be possible to implement MetaMask's behaviour), but does
 * implement prefixed signatures in personal_sign.
 *
 * This middleware serves 2 purposes
 * - It forwards eth_sign requests to personal_sign
 * - To handle misbehaving apps that prefix and send to eth_sign (i.e, depending
 *   on MetaMask's behaviour), it strips off the standard prefix, if found.
 *
 * I need to figure out whether and how to warn the user if the prefix is stripped
 */
export default class SignToPersonalSignSubprovider extends Subprovider {
  constructor(opts) {
    super(opts)
    this.stripPrefix = opts.stripPrefix
  }
  handleRequest(payload, next, end) {
    if (payload.method === 'eth_sign') {
      let [addr, data] = payload.params
      if (this.stripPrefix) data = stripPrefix(data)
      payload.method = 'personal_sign'
      payload.params = [data, addr, '']
    }
    next()
  }
}

// '\x19Ethereum Signed Message:\n'
const prefixHex = '0x19457468657265756d205369676e6564204d6573736167653a0a'
export function stripPrefix(data) {
  if (data.startsWith(prefixHex)) {
    // Check if length of string matches reported length
    let n = 0
    for (let i = prefixHex.length; i < data.length; i += 2) {
      let charCode = parseInt(data.substr(i, 2), 16)
      if (charCode < 48 || charCode > 57) return data
      n = n * 10 + (charCode - 48)
      if (data.length === i + 2 + 2 * n) return '0x' + data.substr(i + 2)
    }
  }
  return data
}
