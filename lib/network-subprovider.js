import WebsocketSubprovider from 'web3-provider-engine/subproviders/websocket'
import FetchSubprovider from 'web3-provider-engine/subproviders/fetch'
import InfuraSubprovider from 'web3-provider-engine/subproviders/infura'

const infuraRegex = /^infura:\/\/(.*)$/
export const websocketRegex = /^wss?:\/\/.*/


export default function networkSubprovider(rpcUrl) {
  if (infuraRegex.test(rpcUrl)) {
    var [_, infuraNetwork] = infuraRegex.exec(rpcUrl)
    return new InfuraSubprovider({ network: infuraNetwork })
  } else if (websocketRegex.test(rpcUrl)) {
    return new WebsocketSubprovider({ rpcUrl })
  } else {
    return new FetchSubprovider({ rpcUrl })
  }
}
