import DefaultFixture from 'web3-provider-engine/subproviders/default-fixture'
import DefaultBlockParameterSubprovider from './middleware/default-block-parameter'
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker'
import SyncCacheSubprovider from './middleware/sync-cache'
import CacheSubprovider from 'web3-provider-engine/subproviders/cache'
import SubscriptionSubprovider from 'web3-provider-engine/subproviders/subscriptions'
import InflightCacheSubprovider from 'web3-provider-engine/subproviders/inflight-cache'
import SanitizingSubprovider from 'web3-provider-engine/subproviders/sanitizer'
import LowerCaseAddressesSubprovider from './middleware/lowercase-addresses'
import GasPaddingSubprovider from './middleware/gas-padding'
import LoggingSubprovider from './middleware/logging'
import SignToPersonalSignSubprovider from './middleware/sign-to-personal-sign'
import MinMaxGasPriceSubprovider from './middleware/min-max-gas-price'
import createLedgerSubprovider from "@ledgerhq/web3-subprovider"
import TransportU2F from "@ledgerhq/hw-transport-u2f"
import FetchSubprovider from 'web3-provider-engine/subproviders/fetch'
import InfuraSubprovider from 'web3-provider-engine/subproviders/infura'

const infuraRegex = /^infura:\/\/(.*)$/

import {version} from './package.json'

export function configureEngine(engine, config) {
  normaliseConfig(config)
  let networkType
  if (infuraRegex.test(config.rpcUrl)) {
    networkType = 'infura'
    var [_, infuraNetwork] = infuraRegex.exec(config.rpcUrl)
  } else {
    networkType = 'rpc'
  }
  if (config.debug) engine.addProvider(new LoggingSubprovider())
  engine.addProvider(new DefaultFixture({ web3_clientVersion: `SpaceSuit/${version}/javascript` }))
  engine.addProvider(new DefaultBlockParameterSubprovider())
  engine.addProvider(new NonceTrackerSubprovider())
  engine.addProvider(new SanitizingSubprovider())
  if (config.useHacks) {
    var syncCacheProvider = new SyncCacheSubprovider({cache: config.cache || window.localStorage, lastChanged: config.lastChanged})
    engine.addProvider(syncCacheProvider)
    syncCacheProvider.patchSend(engine)
  }
  engine.addProvider(new CacheSubprovider())
  let subscriptionSubprovider = new SubscriptionSubprovider({ pendingBlockTimeout: 5000 })
  subscriptionSubprovider.on('data', (err, notification) => {
    engine.emit('data', err, notification)
  })
  engine.addProvider(subscriptionSubprovider)
  engine.addProvider(new InflightCacheSubprovider())
  if (config.useHacks) engine.addProvider(new LowerCaseAddressesSubprovider())
  if (config.useHacks) engine.addProvider(new GasPaddingSubprovider())
  engine.addProvider(new SignToPersonalSignSubprovider({ stripPrefix: config.useHacks }))
  engine.addProvider(new MinMaxGasPriceSubprovider({ minGasPrice: config.minGasPrice, maxGasPrice: config.maxGasPrice }))
  let transportPromise = config.transport || TransportU2F.create()
  let ledgerProvider = createLedgerSubprovider(
    transportPromise, {
      accountsLength: 10,
      networkId: config.chainId,
      path: config.path
    }
  )
  engine.addProvider(ledgerProvider)
  if (config.useHacks) {
    engine._ready.await(() => {
      syncCacheProvider.pollForChanges(ledgerProvider)
    })
  }
  switch (networkType) {
    case 'rpc':
      engine.addProvider(new FetchSubprovider({ rpcUrl: config.rpcUrl }))
      break
    case 'infura':
      engine.addProvider(new InfuraSubprovider({ network: infuraNetwork }))
      break
  }
  if (config.useHacks) {
    engine.isMetaMask = true
    engine.isConnected = function isConnected() {return true}
  }
  return engine
}

export function normaliseConfig(config) {
  if (config.infuraNetwork != null) {
    config.rpcUrl = `infura://${config.infuraNetwork}`
  }
  if (!/x/.test(config.path)) {
    config.path = config.path.replace(/\/0$/, '/x').replace(/\/(\d+)$/, '/x + $1')
  }
}
