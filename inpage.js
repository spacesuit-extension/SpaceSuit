import ProviderEngine from "web3-provider-engine";
import Web3 from 'web3'

import {configureEngine} from './config'
const engine = new ProviderEngine({ pollingInterval: 5000 }) // Can we easily make this configurable?

const configPromise = new Promise((resolve, reject) => {
  document.addEventListener('configureSpacesuit', function configListener(e) {
    resolve(e.detail)
    document.removeEventListener('configureSpacesuit', configListener)
  })
}).then(config => {
  if (config.useHacks) {
    // Lazily load an actual web3 instance
    let web3 = null
    Object.defineProperty(window, 'web3', {
      get() {
        if (web3 === null) {
          web3 = new Web3(engine)
          engine.start()
        }
        return web3
      }
    })
  }
  return configureEngine(engine, config)
})

window.web3 = {
  get currentProvider() {
    configPromise.then(config => {
      // Don't start engine until something asks for it, an it's configured
      engine.start()
    })
    return engine
  }
}
for (let prop of ['version', 'net', 'db', 'shh']) {
  Object.defineProperty(window.web3, prop, {
    get() {
      throw new Error('This is a fake Web3 instance.' +
      ' Check https://github.com/MetaMask/faq/blob/master/detecting_metamask.md' +
      ' for the most portable way of embedding Web3.')
    }
  })
}
