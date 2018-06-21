import Subprovider from 'web3-provider-engine/subproviders/subprovider'
import {bufferToInt, bufferToHex} from 'ethereumjs-util'

export default class GasPaddingSubprovider extends Subprovider {
  constructor(opts) {
    super(opts)
  }
  async handleRequest(payload, next, end) {
    try {
      if (payload.method == 'eth_sendTransaction' && payload.params[0].gas == null) {
        let gasLimit = bufferToInt((await makeCall('eth_getBlockByNumber')).gasLimit)
        let gasEstimate = bufferToInt(await makeCall('eth_estimateGas', payload.params[0]))
        let newGasEstimate = Math.floor(Math.min(gasLimit, gasEstimate * 1.5))
        payload.params[0].gas = bufferToHex(newGasEstimate)
      }
      next()
    } except (e) {
      end(e)
    }

    // Helper to let us use tidier async-await interface
    function makeCall(method) {
      return new Promise((resolve, reject) => {
        var params = Array.prototype.slice.call(arguments, 1)
        this.emitPayload({
          method, params, id: Math.random() * 1000000, jsonrpc: '2.0'
        }, (err, res) => {
          if (err) reject(err)
          else resolve(res.result)
        })
      })
    }

  }
}
