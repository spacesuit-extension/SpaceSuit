var s = document.createElement('script')
s.src = chrome.extension.getURL('inpage.js')
s.onload = function() {
    this.remove()
}
document.documentElement.appendChild(s)
