import Subprovider from 'web3-provider-engine/subproviders/subprovider'


export default class DefaultBlockParameterSubprovider extends Subprovider {
  constructor(opts) {
    super(opts)
  }
  handleRequest(payload, next, end) {
    switch (payload.method) {
      case 'eth_getBalance':
      case 'eth_getCode':
      case 'eth_call':
        if (payload.params.length === 1) payload.params[1] = 'latest'
        break
      case 'eth_getStorageAt':
        if (payload.params.length === 2) payload.params[2] = 'latest'
        break
      case 'eth_getTransactionCount':
        if (payload.params.length === 1) payload.params[1] = 'pending'
        break
    }
    next()
  }
}
