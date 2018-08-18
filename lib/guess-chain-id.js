import networkSubprovider from './network-subprovider.js'

export default async function guessChainId (rpcUrl, cb) {
  let subprovider = networkSubprovider(rpcUrl)
  subprovider.handleRequest({
    jsonrpc: "2.0", method: "net_version", params: [], id: 1
  }, () => console.error("Network provider called next - shouldn't happen"), (err, res) => {
    if (err) console.error(err)
    else cb(parseInt(res))
  })
}
