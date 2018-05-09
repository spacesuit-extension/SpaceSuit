import sigUtil from 'eth-sig-util'
import {toBuffer, bufferToHex} from 'ethereumjs-util'
import EthTx from 'ethereumjs-tx'

const ganacheAccount = '0x5c2f8b40ac54b0ffdde3f74f6ec553701e6b5ae7'
const contractAddress = '0x39164e6e0911c12d04ce50ae9381adcfa7a87db4'
const logSpec = {
  address: '0x39164e6e0911c12d04ce50ae9381adcfa7a87db4',
  fromBlock: 'earliest',
  toBlock: 'latest',
  topics: ['0x00000000000000000000000000000000000000000000000000000000000000ff']
}

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

async function callDirect(method, params) {
  let response = await fetch(
    'http://localhost:1969',
    {
      body: JSON.stringify({
        id: Math.floor(Math.random() * 1000000000000),
        jsonrpc: "2.0",
        method, params
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    }
  )
  let responseJson = await response.json()
  return responseJson.response
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
    return result
  }, method)
}

async function report(action, successMessage) {
  try {
    let result = await action()
    message('success', successMessage)
    return result
  } catch (e) {
    console.error(e)
    message('failure', e)
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
    let filterId = await call('eth_newFilter', [logSpec])
    try {
      let filterLogs = await call('eth_getFilterLogs', [filterId])
      if (filterLogs.length === 0) throw new Error(filterLogs)
    } finally {
      await call('eth_uninstallFilter', [filterId])
    }

  }, 'eth_getFilterLogs')
}

function testSubscribe() {
  return report(async () => {
    let subscriptionId = await call('eth_subscribe', ['logs', logSpec])
    return new Promise((resolve, reject) => {
      window.web3.currentProvider.on('data', (err, res) => {
        if (err) reject(err)
        else if (res.method === 'eth_subscription' && res.params.subscription === subscriptionId) {
          if (res.params.result.address === contractAddress) resolve()
          else reject(new Error('unexpected subscription result:' + JSON.stringify(res)))
        }
      })
    })
  }, 'eth_subscribe')
}

async function setUpAccount() {
  let accounts = await call('eth_accounts', [])
  // Transfer some ether to this account through back channel
  await callDirect('eth_sendTransaction', [{
    to: accounts[0],
    from: ganacheAccount,
    value: '0xde0b6b3a7640000'
  }])
  return accounts[0]
}

function message(status, content) {
  let report = document.createElement('div')
  let statusElement = document.createElement('b')
  statusElement.innerText = statusElement.className = status
  report.appendChild(statusElement)
  report.append(' ' + content)
  document.body.appendChild(report)
}

function validatePersonalMessage(message, account) {
  return function validate(signature) {
    let recovered = sigUtil.recoverPersonalSignature({
      data: message,
      sig: signature
    })
    return norm(account) === norm(recovered)
  }
}

function validateTransaction(account) {
  return function validate(signed) {
    console.log(signed)
    let txBuf = toBuffer(signed.raw)
    let tx = new EthTx(txBuf)
    return norm(bufferToHex(tx.getSenderAddress())) === norm(account)
  }
}

function toNum(x) {
  if (typeof x === 'number') return x
  else return parseInt(x.substr(2), 16)
}

window.addEventListener('load', async () =>  {
  // Now run the tests!
  if (await call('net_version', []) == 71) {
    message('success', 'net_version')
  } else {
    message('skip', 'Skipping tests, because SpaceSuit not configured. Please configure it to use the RPC node on port 1969')
    return
  }

  try {
    var account = await setUpAccount()
    message('success', 'eth_accounts')
  } catch (e) {
    message('failure', 'Could not set up accounts')
    return
  }

  await test('web3_clientVersion', [], 'SpaceSuit/0.0.1/javascript')
  await test('net_listening', [], true)
  await test('net_peerCount', [], (x) => x >= 0)
  await test('eth_blockNumber', [], (x) => toNum(x) > 0)
  await test('eth_call', [{data: '0x', to: contractAddress}], (x) => toNum(x) === 1)
  await test('eth_coinbase', [], account.toLowerCase())
  await test('eth_estimateGas', [{data: '0x'}], (x) => toNum(x) >= 21000)
  await test('eth_gasPrice', [], (x) => toNum(x) > 0)
  await test('eth_getBalance', [ganacheAccount], (x) => toNum(x) > 0)
  let {hash: blockHash} = await test('eth_getBlockByNumber', ['0x1', false], (x) => x.number = '0x1')
  await test('eth_getBlockByHash', [blockHash, false], (x) => x.number = '0x1')
  await test('eth_getBlockTransactionCountByHash', [blockHash], (x) => toNum(x) > 0)
  await test('eth_getBlockTransactionCountByNumber', ['0x1'], (x) => toNum(x) > 0)
  await test('eth_getCode', [contractAddress, 'latest'], '0x60ff60006000a1600160005260206000f3')
  await test('eth_getCode', [contractAddress], '0x60ff60006000a1600160005260206000f3')
  await testGetFilterLogs()
  await test('eth_getLogs', [logSpec], x => x.length > 1)
  await test('eth_getStorageAt', [contractAddress, '0x0', 'latest'], x => toNum(x) === 1)
  await test('eth_getStorageAt', [contractAddress, '0x0'], x => toNum(x) === 1)
  let {hash: txHash} = await test('eth_getTransactionByBlockHashAndIndex', [blockHash, '0x0'], x =>  /0x[0-9a-fA-F]+/.exec(x.blockHash))
  await test('eth_getTransactionByBlockNumberAndIndex', ['0x1', '0x0'], x => /0x[0-9a-fA-F]+/.exec(x.blockHash))
  await test('eth_getTransactionByHash', [txHash], x => x.blockHash === blockHash)
  await test('eth_getTransactionCount', [ganacheAccount], x => toNum(x) > 0)
  await test('eth_getTransactionCount', [ganacheAccount, 'latest'], x => toNum(x) > 0)
  await test('eth_mining', [], false)
  await test('eth_protocolVersion', [], x => toNum(x) !== 0)
  await test('eth_signTransaction', [{data: '0x', from: account}], validateTransaction(account))
  let myTxHash = await test('eth_sendTransaction', [{data: '0x', from: account, to: contractAddress}], x => /0x[0-9a-fA-F]+/.exec(x))
  await test('eth_getTransactionReceipt', [myTxHash], x => toNum(x.logs[0].topics[0]) === 255)
  await test('eth_syncing', [], false)
  await test('personal_sign', ['0x5363686f6f6c627573', account], x => /0x[0-9a-fA-F]+/.exec(x))
  await test('eth_sign', [account, '0x5363686f6f6c627573'], validatePersonalMessage('0x5363686f6f6c627573', account))
  await test('eth_sign', [account, '0x19457468657265756d205369676e6564204d6573736167653a0a395363686f6f6c627573'], validatePersonalMessage('0x5363686f6f6c627573', account))
  // eth_subscribe
  // eth_unsubscribe
  await testFilter('eth_newBlockFilter', [], x => /0x[0-9a-fA-F]+/.exec(x))
  await testFilter('eth_newFilter', [logSpec], x => x.address === contractAddress)
  await testFilter('eth_newPendingTransactionFilter', [], x => /0x[0-9a-fA-F]+/.exec(x))
  await testSubscribe()
  message('success', 'Finished running all tests!!')
})
