// Inject inpage script
var s = document.createElement('script')
s.src = chrome.extension.getURL('inpage.js')
s.onload = function() { this.remove() }
document.documentElement.appendChild(s)

const defaultConfig = JSON.stringify({
  chainId: 1,
  path: "44'/60'/0'/0",
  // rpcUrl: 'http://localhost:8545',
  // rpcUrl: 'https://api.myetherapi.com/eth',
  // rpcUrl: 'https://api.dev.blockscale.net/dev/parity',
  infuraNetwork: 'mainnet',
  useHacks: true,
  debug: true
})
window.addEventListener('load', () => {
  chrome.storage.local.get({spacesuitConfig: defaultConfig}, (config) => {
    var evt = document.createEvent("CustomEvent")
    evt.initCustomEvent("configureSpacesuit", true, true, config.spacesuitConfig)
    document.dispatchEvent(evt)
  })
})
