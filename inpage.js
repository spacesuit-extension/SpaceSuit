import ProviderEngine from "./middleware/advanced-provider-engine";

import {configureEngine} from './lib/config.js'
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
          let Web3 = require('web3')
          web3 = new Web3(engine)
          engine.start()
          // Initialise defaultAccount with coinbase
          web3.eth.getCoinbase((err, res) => {
            if (err) console.error(err)
            if (res) web3.eth.defaultAccount = res
          })
        }
        return web3
      },
      set(value) {
        web3 = value
      }
    })
  }
  return configureEngine(engine, config)
})

window.web3 = {
  get currentProvider() {
    configPromise.then(config => {
      // Don't start engine until something asks for it, and it's configured
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
