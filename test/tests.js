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
    setTimeout(reject, t)
  })
}

function norm(value) {
  return JSON.stringify(value).toLowerCase()
}
async function test(method, params, assertion) {
  try {
    let result = await timeout(call(method, params), 10000)
    if (typeof assertion == 'function') {
      if (!assertion(result)) throw new Error("Assertion Failed")
    } else {
      if (norm(result) !== norm(assertion)) {
        throw new Error(`${norm(result)} != ${norm(assertion)}`)
      }
    }
    let report = document.createElement('div')
    let status = document.createElement('b')
    status.innerText = status.className = 'success'
    report.appendChild(status)
    report.append(' ' + method)
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
  // eth_getFilterChanges
  // eth_getFilterLogs
  // eth_getLogs
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
  // eth_newBlockFilter
  // eth_newFilter
  // eth_newPendingTransactionsFilter
  await test('eth_protocolVersion', [], x => toNum(x) !== 0)
  // eth_sendRawTransaction
  // eth_sendTransaction
  // eth_signTransaction
  await test('eth_syncing', [], false)
  // eth_uninstallFilter
  // personal_sign
  // eth_subscribe
  // eth_unsubscribe
})