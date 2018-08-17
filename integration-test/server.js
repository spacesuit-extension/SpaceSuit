const fs = require('fs')
const https = require('https')
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const {makeFakeBlockchain} = require('../lib/test-utils.js')

makeFakeBlockchain()

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
