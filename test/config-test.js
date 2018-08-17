import fs from 'fs'
import path from 'path'
import TransportHID from '@ledgerhq/hw-transport-node-hid'
import ProviderEngine from '../middleware/advanced-provider-engine.js'
import {RecordStore, createTransportRecorder, createTransportReplayer} from '@ledgerhq/hw-transport-mocker'
import {assert} from 'chai'
import {makeFakeBlockchain} from '../lib/test-utils.js'
import {configureEngine} from '../lib/config.js'
import defaultConfig from '../default-config.json'

const RECORDING_FILENAME = path.join(__dirname, 'ledger-oracle.json')

describe('configureEngine', function () {
  var transport, recordStore, fakeBlockchain
  before(async function beforeFn () {
    if (process.env.RECORD_LEDGER_TESTS === 'true') {
      recordStore = new RecordStore()
      let Transport = createTransportRecorder(TransportHID, recordStore)
      transport = await Transport.open((await Transport.list())[0])
    } else {
      let recording = JSON.parse(fs.readFileSync(RECORDING_FILENAME, 'utf-8'))
      recordStore = RecordStore.fromObject(recording)
      let Transport = createTransportReplayer(recordStore)
      transport = await Transport.open()
    }
    fakeBlockchain = await makeFakeBlockchain()
  })
  after(async function afterFn () {
    if (process.env.RECORD_LEDGER_TESTS === 'true') {
      let recording = recordStore.toObject()
      fs.writeFileSync(RECORDING_FILENAME, JSON.stringify(recording, null, 2))
    }
    await transport.close()
    await fakeBlockchain.close()
  })
  function makeConfig(options = {}) {
    return Object.assign({}, defaultConfig, {
      transport: Promise.resolve(transport),
      rpcUrl: "http://localhost:1969",
      chainId: 71,
      cache: {},
      path: "44'/1'/0'/x"
    }, options)
  }
  let engine
  beforeEach(function () {
    engine = new ProviderEngine({pollingInterval: 100})
  })
  function makeCall(method) {
    let params = Array.prototype.slice.call(arguments, 1)
    return new Promise((resolve, reject) => {
      engine.sendAsync({
        id: 1, jsonrpc: '2.0', method, params
      }, (err, res) => {
        if (err) reject(err)
        else resolve(res.result)
      })
    })
  }
  it('should configure account offset and length', async function () {
    configureEngine(engine, makeConfig({accountsOffset: 1, accountsLength: 2}))
    engine.start()
    try {
      assert.deepEqual(await makeCall('eth_accounts'), [
        '0x4d495554ceaba671ba56f435cac3306d85035e30',
        '0xc3e27eed716c0236f5634631ee2b72a113a120f7',
      ])
    } finally {
      engine.stop()
    }
  })
  it('should configure rpc url', async function () {
    configureEngine(engine, makeConfig())
    engine.start()
    try {
      assert.equal(await makeCall('net_version'), 71)
    } finally {
      engine.stop()
    }
  })
  it('should configure min and max gas prices', async function () {
    this.timeout(30000)
    configureEngine(engine, makeConfig({minGasPrice: 100, maxGasPrice: 200}))
    engine.start()
    try {
      let lowTx = await makeCall('eth_signTransaction', {
        gasPrice: '0x0',
        from: '0x4d495554ceaba671ba56f435cac3306d85035e30',
        to: '0x1234567890123456789012345678901234567890',
        value: '0x0'
      })
      assert.equal(lowTx.tx.gasPrice, '0x64')

      let highTx = await makeCall('eth_signTransaction', {
        gasPrice: '0x100',
        from: '0x4d495554ceaba671ba56f435cac3306d85035e30',
        to: '0x1234567890123456789012345678901234567890',
        value: '0x0'
      })
      assert.equal(highTx.tx.gasPrice, '0xc8')
    } finally {
      engine.stop()
    }
  })
  it('should shouldn\'t limit gas prices if no limit configured', async function () {
    this.timeout(30000)
    configureEngine(engine, makeConfig({}))
    engine.start()
    try {
      let tx = await makeCall('eth_signTransaction', {
        gasPrice: '0x100000000',
        from: '0x4d495554ceaba671ba56f435cac3306d85035e30',
        to: '0x1234567890123456789012345678901234567890',
        value: '0x0'
      })
      assert.equal(tx.tx.gasPrice, '0x100000000')
    } finally {
      engine.stop()
    }
  })
})
