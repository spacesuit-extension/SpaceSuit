import React from 'react'
import ReactDOM from 'react-dom'
import StyledOptionsMenu from './components/options-menu'
import guessChainId from './lib/guess-chain-id'
import defaultConfig from './default-config.json'

chrome.storage.local.get({spacesuitConfig: defaultConfig}, ({spacesuitConfig: config}) => {
  ReactDOM.render(
    <StyledOptionsMenu
      config={config}
      saveConfig={(config, cb) => chrome.storage.local.set({spacesuitConfig: config}, cb)}
      guessChainId={guessChainId}
      />,
    document.getElementById('app')
  )
})
