import {assert} from 'chai'

import {identifyNetworkFromConfig} from '../components/options-menu.js'

describe('options-menu.js', function () {
  describe('identifyNetworkFromConfig', function () {
    it('should identify networks and path styles from config', function () {
      assert.deepEqual(identifyNetworkFromConfig({
        rpcUrl: 'infura://mainnet',
        path: "44'/60'/0'/x"
      }), {network: 'Infura (Recommended)', pathStyle: 'ledger_old'})
      assert.deepEqual(identifyNetworkFromConfig({
        rpcUrl: 'https://api.dev.blockscale.net/dev/parity',
        path: "44'/60'/0'/0/x"
      }), {network: 'Blockscale', pathStyle: 'compat'})
      assert.deepEqual(identifyNetworkFromConfig({
        rpcUrl: 'https://mew.epool.io',
        path: "44'/61'/x'/0/0"
      }), {network: 'Epool MEW', pathStyle: 'ledger_new'})
    })
    it('should upgrade old-style configs', function () {
      assert.deepEqual(identifyNetworkFromConfig({
        infuraNetwork: 'mainnet',
        path: "44'/60'/0'/x"
      }), {network: 'Infura (Recommended)', pathStyle: 'ledger_old'})
      assert.deepEqual(identifyNetworkFromConfig({
        rpcUrl: 'https://api.myetherapi.coeth',
        path: "44'/60'/0'/0"
      }), {network: 'MyEtherAPI', pathStyle: 'ledger_old'})
    })
  })
  it('should default to "Custom" if config isn\'t recognised', function () {
    assert.deepEqual(identifyNetworkFromConfig({
      rpcUrl: 'http://localhost:8545',
      path: "44'/60'/0'/x" // Old format incorrectly used in previous versions
    }), {network: 'Custom', pathStyle: 'ledger_old'})
    assert.deepEqual(identifyNetworkFromConfig({
      rpcUrl: 'https://etc-geth.0xinfra.com',
      path: "44'/60'/160720'/0" // Old format incorrectly used in previous versions
    }), {network: 'Custom', pathStyle: 'ledger_old'})
  })
})
