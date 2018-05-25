import Subprovider from 'web3-provider-engine/subproviders/subprovider'
import {BN, toBuffer, bufferToHex} from 'ethereumjs-util'


export default class MinMaxGasPriceSubprovider extends Subprovider {
  constructor(opts = {}) {
    super(opts)
    this.minGasPrice = opts.minGasPrice
    this.maxGasPrice = opts.maxGasPrice
  }
  handleRequest(payload, next, end) {
    switch(payload.method) {
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
        let tx = payload.params[0]

        const andThen = () => {
          let gasPrice = new BN(toBuffer(tx.gasPrice))
          if (this.minGasPrice != null) {
            let minGasPrice = new BN(this.minGasPrice)
            if (gasPrice.lt(minGasPrice)) {
              tx.gasPrice = bufferToHex(minGasPrice)
            }
          }
          if (this.maxGasPrice != null) {
            let maxGasPrice = new BN(this.maxGasPrice)
            if (gasPrice.gt(maxGasPrice)) {
              tx.gasPrice = bufferToHex(maxGasPrice)
            }
          }
          next()
        }

        if (tx.gasPrice == null) {
          this.emitPayload({
            method: 'eth_gasPrice',
            params: []
          }, (err, res) => {
            if (err) end(err)
            else {
              tx.gasPrice = res.result
              andThen()
            }
          })
        } else andThen()

        return
      default:
        next()
        return
    }
  }
}
