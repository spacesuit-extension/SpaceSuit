import sigUtil from 'eth-sig-util'
import EthTx from 'ethereumjs-tx'

function call(method, params) {
  return new Promise((resolve, reject) =>  {
    window.web3.currentProvider.sendAsync({
      jsonrpc: '2.0',
      method, params,
      id: Math.floor(Math.random() * 1000000000000)
    }, (err, result) => {
      if (err) reject(err)
      else resolve(result.result)
    })
  })
}

function timeout(p, t) {
  return new Promise((resolve, reject) => {
    p.then(resolve, reject)
    setTimeout(() => reject('Timeout'), t)
  })
}

function pause(t) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, t)
  })
}

function norm(value) {
  return JSON.stringify(value).toLowerCase()
}
function test(method, params, assertion) {
  return report(async function () {
    let result = await timeout(call(method, params), 10000)
    if (typeof assertion == 'function') {
      if (!assertion(result)) throw new Error("Assertion Failed")
    } else {
      if (norm(result) !== norm(assertion)) {
        throw new Error(`${norm(result)} != ${norm(assertion)}`)
      }
    }
  }, method)
}

async function report(action, successMessage) {
  try {
    await action()
    let report = document.createElement('div')
    let status = document.createElement('b')
    status.innerText = status.className = 'success'
    report.appendChild(status)
    report.append(' ' + successMessage)
    document.body.appendChild(report)
  } catch (e) {
    console.error(e)
    let report = document.createElement('div')
    let status = document.createElement('b')
    status.innerText = status.className = 'failure'
    report.appendChild(status)
    report.append(' ' + e)
    document.body.appendChild(report)
  }
}

function testFilter(method, args, assertion) {
  return report(async () => {
    let filterId = await call(method, args)
    try {
      for (let i = 0; i < 120; i++) {
        let result = await call('eth_getFilterChanges', [filterId])
        if (result.length > 0) {
          if (assertion(result[0])) return
          else throw new Error(JSON.stringify(result))
        }
        await pause(1000)
      }
      throw new Error('No filter changes in 30 seconds')
    } finally {
      await call('eth_uninstallFilter', [filterId])
    }
  }, method)
}

function testGetFilterLogs() {
  return report(async () => {
    let filterId = await call('eth_newFilter', [{address: '0x0b8D56c26D8CF16FE1BdDf4967753503d974DE06', fromBlock: '0x25ad43', toBlock: '0x25ad50', topics: []}])
    try {
      let filterLogs = await call('eth_getFilterLogs', [filterId])
      if (filterLogs.length !== 1) throw new Error(filterLogs)
    } finally {
      await call('eth_uninstallFilter', [filterId])
    }

  }, 'eth_getFilterLogs')
}

async function skipIfMainnet(f) {
  let networkId = await call('net_version', [])
  if (networkId == 1) { // This covers ETH and ETC, but need to be more careful if testing other forks
    let report = document.createElement('div')
    let status = document.createElement('b')
    status.innerText = status.className = 'skip'
    report.appendChild(status)
    report.append(' Skipping transactional test, because on mainnet')
    document.body.appendChild(report)
  } else {
    await f()
  }
}

function toNum(x) { return parseInt(x.substr(2), 16) }

window.addEventListener('load', async () =>  {
  // Now run the tests!
  await test('web3_clientVersion', [], 'SpaceSuit/0.0.1/javascript')
  await test('net_listening', [], true)
  await test('net_peerCount', [], (x) => x >= 0)
  await test('net_version', [], "1")
  await test('eth_accounts', [], (x) => x[1] === '0x758e53a86224f6511dbcabd9a364e21b4689653f')
  await test('eth_blockNumber', [], (x) => toNum(x) > 5000000)
  await test('eth_call', [{data: '0x16c72721', to: '0x2BD2326c993DFaeF84f696526064FF22eba5b362', from: '0x2BD2326c993DFaeF84f696526064FF22eba5b362'}], (x) => toNum(x) === 1)
  await test('eth_coinbase', [], x => /0x[0-9a-fA-F]{40}/.exec(x))
  await test('eth_estimateGas', [{data: '0x'}], (x) => toNum(x) >= 21000)
  await test('eth_gasPrice', [], (x) => toNum(x) > 0)
  await test('eth_getBalance', ['0x281055Afc982d96fAB65b3a49cAc8b878184Cb16'], (x) => toNum(x) > 0)
  await test('eth_getBlockByHash', ['0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6', false], (x) => x.number = '0x1')
  await test('eth_getBlockByNumber', ['0x1', false], (x) => x.number = '0x1')
  await test('eth_getBlockTransactionCountByHash', ['0x88e96d4537bea4d9c05d12549907b32561d3bf31f45aae734cdc119f13406cb6'], '0x0')
  await test('eth_getBlockTransactionCountByNumber', ['0x1'], '0x0')
  await test('eth_getCode', ['0x2BD2326c993DFaeF84f696526064FF22eba5b362'], x => /0x[0-9a-fA-F]+/.exec(x))
  await testGetFilterLogs()
  await test('eth_getLogs', [{address: '0x0b8D56c26D8CF16FE1BdDf4967753503d974DE06', fromBlock: '0x25ad43', toBlock: '0x25ad50', topics: []}], x => x.length === 1)
  await test('eth_getStorageAt', ['0x2BD2326c993DFaeF84f696526064FF22eba5b362', '0x0', 'latest'], x => toNum(x) === 1)
  await test('eth_getTransactionByBlockHashAndIndex', ['0x6accdba8a0531b4a66811b5f537ba77ee2440ad52e7d17091b88a482b391d48d', '0x0'], x =>  /0x[0-9a-fA-F]+/.exec(x.blockHash))
  await test('eth_getTransactionByBlockNumberAndIndex', ['0x525ee2', '0x0'], x => /0x[0-9a-fA-F]+/.exec(x.blockHash))
  await test('eth_getTransactionByHash', ['0xf57922fbedb817c72c0ce045ddbaa1895638f769ba303a0eed597b98108a637e'], x => /0x[0-9a-fA-F]+/.exec(x.blockHash))
  await test('eth_getTransactionCount', ['0x2a65Aca4D5fC5B5C859090a6c34d164135398226'], x => toNum(x) > 0)
  await test('eth_getTransactionCount', ['0x2a65Aca4D5fC5B5C859090a6c34d164135398226', '0x508da8'], x => toNum(x) === 3209851)
  await test('eth_getTransactionReceipt', ['0xf57922fbedb817c72c0ce045ddbaa1895638f769ba303a0eed597b98108a637e'], x => toNum(x.gasUsed) > 0)
  await test('eth_getUncleByBlockHashAndIndex', ['0x9e7e9a804426089654b1dc6b993ada134c4e58f539acae12dc037bc7f482cd87', '0x0'], x =>  /0x[0-9a-fA-F]{40}/.exec(x.miner))
  await test('eth_getUncleByBlockNumberAndIndex', ['0x531a82', '0x0'], x => /0x[0-9a-fA-F]{40}/.exec(x.miner))
  await test('eth_getUncleCountByBlockHash', ['0x9e7e9a804426089654b1dc6b993ada134c4e58f539acae12dc037bc7f482cd87'], x => toNum(x) === 1)
  await test('eth_getUncleCountByBlockNumber', ['0x531a82'], x => toNum(x) === 1)
  await test('eth_mining', [], false)
  await test('eth_protocolVersion', [], x => toNum(x) !== 0)
  // eth_sendRawTransaction
  await skipIfMainnet(async () => test('eth_sendTransaction', [{data: '0x', from: await call('eth_coinbase', [])}], x => /0x[0-9a-fA-F]+/.exec(x.raw)))
  await test('eth_signTransaction', [{data: '0x', from: await call('eth_coinbase', [])}], x => /0x[0-9a-fA-F]+/.exec(x.raw))
  await test('eth_syncing', [], false)
  await test('personal_sign', ['0x5363686f6f6c627573', await call('eth_coinbase', [])], x => /0x[0-9a-fA-F]+/.exec(x))
  await test('eth_sign', [await call('eth_coinbase', []), '0x5363686f6f6c627573'], x => /0x[0-9a-fA-F]+/.exec(x))
  await test('eth_sign', [await call('eth_coinbase', []), '0x19457468657265756d205369676e6564204d6573736167653a0a395363686f6f6c627573'], x => /0x[0-9a-fA-F]+/.exec(x))
  // eth_subscribe
  // eth_unsubscribe
  await testFilter('eth_newBlockFilter', [], x => /0x[0-9a-fA-F]+/.exec(x))
  await testFilter('eth_newFilter', [{address: '0x8d12A197cB00D4747a1fe03395095ce2A5CC6819', fromBlock: '0x0', toBlock: 'latest', limit: '0xa'}], x => x.address === '0x8d12a197cb00d4747a1fe03395095ce2a5cc6819')
  await testFilter('eth_newPendingTransactionFilter', [], x => /0x[0-9a-fA-F]+/.exec(x))

})
