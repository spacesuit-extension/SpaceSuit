const fs = require('fs')
const https = require('https')
const finalhandler = require('finalhandler')
const Ganache = require('ganache-core')
const memdown = require('memdown')
const serveStatic = require('serve-static')

const mnemonic = 'hero rocket space suit atom helmet alien flash jacket solar engine vacuum'
const contractCode = (
  // Simple contract that logs 0xff whenever called
  '0x' +
  // Constructor bootstrap
  '6007' + // PUSH1 0x7 (length)
  '600c' + // PUSH1 0xc (code offset)
  '6000' + // PUSH1 0x0 (memory offset)
  '39' + // CODECOPY
  '6007' + // PUSH1 0x1 (length)
  '6000' + // PUSH1 0x0 (memory offset)
  'f3' + // RETURN
  // Runtime code
  '60ff' + // PUSH1 0xff (index)
  '6000' + // PUSH1 0x0 (mem length)
  '6000' + // PUSH1 0x0 (mem offset)
  'a1' // LOG1
)

var blockchainServer = Ganache.server({
  mnemonic,
  network_id: 1969,
  default_balance_ether: 1000000,
  port: 1969,
  gas_price: 1000000000,
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
