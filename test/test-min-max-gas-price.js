import {assert} from 'chai'

import MinMaxGasPriceSubprovider from '../middleware/min-max-gas-price'

describe('MinMaxGasPriceSubprovider', function () {
  it('does nothing if there is no min or max gas price', function (done) {
    let instance = new MinMaxGasPriceSubprovider()
    let payload = {
      method: 'eth_sendTransaction',
      params: [{
        gasPrice: '0x64' // 100
      }]
    }
    instance.handleRequest(payload, () => {
      assert.equal(payload.params[0].gasPrice, '0x64')
      done()
    }, null)
  })
  it("increases gas if it's below the minimum", function (done) {
    let instance = new MinMaxGasPriceSubprovider({
      minGasPrice: '200'
    })
    let payload = {
      method: 'eth_sendTransaction',
      params: [{
        gasPrice: '0x64' // 100
      }]
    }
    instance.handleRequest(payload, () => {
      assert.equal(payload.params[0].gasPrice, '0xc8') // 200
      done()
    }, null)
  })
  it("reduces gas if it's below the minimum", function (done) {
    let instance = new MinMaxGasPriceSubprovider({
      maxGasPrice: '50'
    })
    let payload = {
      method: 'eth_sendTransaction',
      params: [{
        gasPrice: '0x64' // 100
      }]
    }
    instance.handleRequest(payload, () => {
      assert.equal(payload.params[0].gasPrice, '0x32') // 50
      done()
    }, null)
  })
  it("obtains a gas price from the network before processing, if there's no gas price provided", function (done) {
    let instance = new MinMaxGasPriceSubprovider({
      maxGasPrice: '50'
    })
    instance.setEngine({
      sendAsync(payload, cb) {
        if (payload.method === 'eth_gasPrice') cb(null, {result: '0x64'})
        else cb(new Error("Mock engine"))
      },
      on() {}
    })
    let payload = {
      method: 'eth_sendTransaction',
      params: [{
        gasPrice: '0x64' // 100
      }]
    }
    instance.handleRequest(payload, () => {
      assert.equal(payload.params[0].gasPrice, '0x32') // 50
      done()
    }, null)
  })
})
