import {assert} from 'chai'

import ProviderEngine from '../middleware/advanced-provider-engine'
import Subprovider from 'web3-provider-engine/subproviders/subprovider'
import LoggingSubprovider from '../middleware/logging'
import GasPaddingSubprovider from '../middleware/gas-padding'

class MockBlockchainProvider extends Subprovider {
  constructor(opts) {
    super(opts)
    this.gasEstimate = opts.gasEstimate
    this.expectedGas = opts.expectedGas
    this.gasLimit = opts.gasLimit || '0x100000000'
  }
  handleRequest(payload, next, end) {
    switch (payload.method) {
      case 'eth_sendTransaction':
        if (payload.params[0].gas === this.expectedGas) {
          return end(null, {status: 1})
        } else {
          return end(new Error(`Expected gas extimate ${this.expectedGas}, actual: ${payload.params[0].gas}`))
        }
      case 'eth_estimateGas':
        return end(null, this.gasEstimate)
      case 'eth_blockNumber':
        return end(null, '0x1')
      case 'eth_getBlockByNumber':
        if (payload.params[0] === 'latest' || payload.params[0] === '0x1') return end(null, {number: '0x1', gasLimit: this.gasLimit})
        else return end(null, null)
      default:
        return end(new Error(`Method ${payload.method} not implemented in mock`))
    }
  }
}

function runInTestHarness(opts, request) {
  let engine = new ProviderEngine({pollingInterval: 100})
  engine.addProvider(new GasPaddingSubprovider(opts))
  engine.addProvider(new MockBlockchainProvider(opts))
  engine.start()
  return new Promise((resolve, reject) => {
    engine.sendAsync(request, (err, res) => {
      try {
        if (err) reject(err)
        else resolve(res)
      } finally {
        engine.stop()
      }
    })
  })
}

describe('GasPaddingSubprovider', function() {
  it('should pad gas estimates by a fixed percentage, when no gas limit is supplied', async function () {
    await runInTestHarness({
      gasEstimate: '0x10000',
      expectedGas: '0x28000',
      estimateMultiplier: 2.5
    }, {method: 'eth_sendTransaction', params: [{}]})
  })
  it('should bound gas estimates by the block limit', async function () {
    await runInTestHarness({
      gasEstimate: '0x10000',
      expectedGas: '0x20000',
      gasLimit: '0x28000',
      estimateMultiplier: 2.5,
      maxGasMultiplier: 0.8
    }, {method: 'eth_sendTransaction', params: [{}]})
  })
  it('should not modify transactions that already have a gas limit', async function () {
    await runInTestHarness({
      gasEstimate: '0x10000',
      expectedGas: '0x123456789',
      gasLimit: '0x28000',
      estimateMultiplier: 2.5,
      maxGasMultiplier: 0.8
    }, {method: 'eth_sendTransaction', params: [{gas: '0x123456789'}]})
  })
})
