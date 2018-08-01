import {assert} from 'chai'
import {shallow} from 'enzyme'
import sinon from 'sinon'
import React from 'react'

import {identifyNetworkFromConfig, OptionsMenu} from '../components/options-menu.js'
import defaultConfig from '../default-config.json'

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
      rpcUrl: 'https://api.myetherapi.com/eth',
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

describe('OptionsMenu', function () {
  function withConfig (config) {
    return shallow(<OptionsMenu classes={{}} config={Object.assign({}, defaultConfig, config)} />)
  }
  it('should not show errors if account lengths or offsets are positive numbers', function () {
    assert.isOk(withConfig({accountsOffset: 'x'}).find('[label="First Account"]').prop('error'))
    assert.isOk(withConfig({accountsLength: -1}).find('[label="Number Of Accounts"]').prop('error'))
    assert.isOk(withConfig({accountsLength: ''}).find('[label="Number Of Accounts"]').prop('error'))
  })
  it('should show errors if account lengths or offsets are not positive numbers', function () {
    assert.isNotOk(withConfig({accountsOffset: '1'}).find('[label="First Account"]').prop('error'))
    assert.isNotOk(withConfig({accountsLength: 1}).find('[label="Number Of Accounts"]').prop('error'))
  })
  it('should disable the submit button if there are any validation errors', function () {
    assert.isOk(withConfig({accountsLength: ''}).find('#saveButton').prop('disabled'))
    assert.isOk(withConfig({accountsOffset: -2}).find('#saveButton').prop('disabled'))
    assert.isOk(withConfig({chainId: null}).find('#saveButton').prop('disabled'))
    assert.isOk(withConfig({minGasPrice: 'x'}).find('#saveButton').prop('disabled'))
    assert.isOk(withConfig({maxGasPrice: '.'}).find('#saveButton').prop('disabled'))
  })
  it('should support a happy-path reconfiguration flow', function () {
    let saveConfig = sinon.spy()
    let instance = shallow(<OptionsMenu classes={{}} config={Object.assign({}, defaultConfig)} saveConfig={saveConfig}/>)
    instance.find('#networkSelect').simulate('change', {target: {value: 'Epool MEW'}})
    instance.find('#pathStyleSelect').simulate('change', {target: {value: 'compat'}})
    instance.find('#networkSelect').simulate('change', {target: {value: 'Custom'}})
    assert.equal(instance.find('[label="RPC URL"]').prop('value'), 'https://mew.epool.io')
    assert.equal(instance.find('[label="Chain Id"]').prop('value'), 61)
    assert.equal(instance.find('[label="Derivation Path"]').prop('value'), "44'/61'/0'/0/x")
    instance.find('[label="First Account"]').simulate('change', {target: {value: '5'}})
    instance.find('[label="Number Of Accounts"]').simulate('change', {target: {value: '20'}})
    instance.find('#saveButton').simulate('click')
    assert(saveConfig.called)
    let config = saveConfig.lastCall.args[0]
    assert.equal(config.chainId, 61)
    assert.equal(config.path, "44'/61'/0'/0/x")
    assert.equal(config.rpcUrl, "https://mew.epool.io")
    assert.equal(config.useHacks, true)
    assert.equal(config.debug, false)
    assert.equal(config.minGasPrice, null)
    assert.equal(config.maxGasPrice, null)
    assert.equal(config.accountsOffset, 5)
    assert.equal(config.accountsLength, 20)
  })
})
