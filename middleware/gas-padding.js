import Subprovider from 'web3-provider-engine/subproviders/subprovider'
import {bufferToInt} from 'ethereumjs-util'

export default class GasPaddingSubprovider extends Subprovider {
  constructor(opts = {}) {
    super(opts)
    this.maxGasMultiplier = opts.maxGasMultiplier || 0.95
    this.estimateMultiplier = opts.estimateMultiplier || 1.5
  }
  async handleRequest(payload, next, end) {
    let self = this
    try {
      switch (payload.method) {
        case 'eth_sendTransaction':
        case 'eth_signTransaction':
          if (payload.params[0].gas == null) {
            let gasLimit = bufferToInt((await makeCall('eth_getBlockByNumber', 'latest', false)).gasLimit)
            let gasEstimate = bufferToInt(await makeCall('eth_estimateGas', payload.params[0]))


            let newGasEstimate = Math.floor(Math.min(
              gasLimit * this.maxGasMultiplier,
              gasEstimate * this.estimateMultiplier
            ))
            payload.params[0].gas = '0x' + newGasEstimate.toString(16)
          }
      }
      next()
    } catch (e) {
      end(e)
    }

    // Helper to let us use tidier async-await interface
    function makeCall(method) {
      return new Promise((resolve, reject) => {
        var params = Array.prototype.slice.call(arguments, 1)
        self.emitPayload({
          method, params, id: Math.random() * 1000000, jsonrpc: '2.0'
        }, (err, res) => {
          if (err) reject(err)
          else resolve(res.result)
        })
      })
    }

  }
}
