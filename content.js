import * as defaultConfig from './default-config.json'
// Inject inpage script
var s = document.createElement('script')
s.src = chrome.extension.getURL('inpage.js')
s.onload = function() {
  this.remove()
  chrome.storage.local.get({spacesuitConfig: defaultConfig}, (config) => {
    var evt = document.createEvent("CustomEvent")
    evt.initCustomEvent("configureSpacesuit", true, true, config.spacesuitConfig)
    document.dispatchEvent(evt)
  })
}
document.documentElement.appendChild(s)
