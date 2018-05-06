const fs = require('fs')
const https = require('https')
const finalhandler = require('finalhandler')
const Ganache = require('ganache-core')
const memdown = require('memdown')
const serveStatic = require('serve-static')

const mnemonic = 'hero rocket space suit atom helmet alien flash jacket solar engine vacuum'
const contractCode = (
  // Simple contract that logs 0xff whenever called, and returns 1
  '0x' +
  // Constructor bootstrap
  // Set value 0 of storage to 1
  '6001' + // PUSH1 0x1 (storage value)
  '6000' + // PUSH1 0x0 (storage location)
  '55' + // SSTORE
  // Load runtime code
  '6011' + // PUSH1 0x11 (length)
  '6011' + // PUSH1 0x11 (code offset - same size is coincidence)
  '6000' + // PUSH1 0x0 (memory offset)
  '39' + // CODECOPY
  // Return runtime code from constructos
  '6011' + // PUSH1 0x1 (length)
  '6000' + // PUSH1 0x0 (memory offset)
  'f3' + // RETURN
  // Runtime code
  // Log with topic 0xff
  '60ff' + // PUSH1 0xff (index)
  '6000' + // PUSH1 0x0 (mem length)
  '6000' + // PUSH1 0x0 (mem offset)
  'a1' + // LOG1
  // Write 1 to memory location 0
  '6001' + // PUSH1 0x1 (data)
  '6000' + // PUSH1 0x0 (memory location)
  '52' + // MSTORE
  // Return 32 bytes from memory location 0
  '6020' + // PUSH1 0x20 (length)
  '6000' + // PUSH1 0x0 (memory location)
  'f3' // RETURN
)

var blockchainServer = Ganache.server({
  mnemonic,
  network_id: 71,
  default_balance_ether: 1000000000000,
  port: 1969,
  gasPrice: 1000000000,
  locked: true,
  unlocked_accounts: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  ws: false,
  hdPath: "m/44'/1'/0'/0/",
  db: memdown()
})

blockchainServer.listen(1969)

var provider = blockchainServer.provider

function call(method) {
  var params = Array.prototype.slice.call(arguments, 1)
  return new Promise((resolve, reject) =>  {
    provider.sendAsync({
      jsonrpc: '2.0',
      method, params,
      id: Math.floor(Math.random() * 1000000000000)
    }, (err, result) => {
      if (err) reject(err)
      else resolve(result.result)
    })
  })
}
console.log('Serving RPC on port 1969')

async function setupAccounts() {
  let accounts = await call('eth_accounts')
  let deployTx = await call('eth_sendTransaction', {
    from: accounts[0],
    data: contractCode,
  })
  let {contractAddress} = await call('eth_getTransactionReceipt', deployTx)
  setInterval(async () => {
    let tx = await call('eth_sendTransaction', {
      from: accounts[0],
      to: contractAddress,
    })
  }, 1000)
  console.log('Sending to', contractAddress, 'from', accounts[0])
}

setupAccounts()

let serve = serveStatic('./build', {index: ['index.html'], fallthrough: false})
function handleRequest(req, res) {
  serve(req, res, finalhandler(req, res))
}
let server = https.createServer({
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem')
}, handleRequest)

server.listen(4443)
console.log('Serving HTTPS on port 4443')
console.log('Configure SpaceSuit to talk to http://localhost:1969, and then open https://localhost:4443 to run the tests')
