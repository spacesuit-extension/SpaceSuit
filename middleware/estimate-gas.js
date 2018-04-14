import Subprovider from 'web3-provider-engine/subproviders/subprovider'


export default class EstimateGasSubprovider extends Subprovider {
  constructor(opts) {
    super(opts)
  }
  handleRequest(payload, next, end) {
    if (
      (payload.method === 'eth_sendTransaction' || payload.method === 'eth_signTransaction')
      && (payload.params[0].gas == null)
    ) {
      this.emitPayload({
        method: 'eth_estimateGas',
        params: payload.params
      }, (error, res) => {
        if (res) payload.params[0].gas = res.result
        next()
      })
    } else next()

  }
}
