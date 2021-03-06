import DefaultFixture from 'web3-provider-engine/subproviders/default-fixture'
import DefaultBlockParameterSubprovider from '../middleware/default-block-parameter'
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker'
import SyncCacheSubprovider from '../middleware/sync-cache'
import CacheSubprovider from 'web3-provider-engine/subproviders/cache'
import FilterSubprovider from 'web3-provider-engine/subproviders/filters'
import SubscriptionSubprovider from 'web3-provider-engine/subproviders/subscriptions'
import InflightCacheSubprovider from 'web3-provider-engine/subproviders/inflight-cache'
import SanitizingSubprovider from 'web3-provider-engine/subproviders/sanitizer'
import LowerCaseAddressesSubprovider from '../middleware/lowercase-addresses'
import GasPaddingSubprovider from '../middleware/gas-padding'
import LoggingSubprovider from '../middleware/logging'
import SignToPersonalSignSubprovider from '../middleware/sign-to-personal-sign'
import MinMaxGasPriceSubprovider from '../middleware/min-max-gas-price'
import createLedgerSubprovider from "@ledgerhq/web3-subprovider"
import TransportU2F from "@ledgerhq/hw-transport-u2f"
import WebsocketSubprovider from 'web3-provider-engine/subproviders/websocket'
import FetchSubprovider from 'web3-provider-engine/subproviders/fetch'
import InfuraSubprovider from 'web3-provider-engine/subproviders/infura'
import {version} from '../package.json'

import networkSubprovider, { websocketRegex } from './network-subprovider.js'

export function configureEngine(engine, config) {
  let supportsSubscribe = websocketRegex.test(config.rpcUrl)
  normaliseConfig(config)
  if (config.debug) engine.addProvider(new LoggingSubprovider())
  if (config.useHacks) {
    var syncCacheProvider = new SyncCacheSubprovider({cache: config.cache || window.localStorage, lastChanged: config.lastChanged})
    engine.addProvider(syncCacheProvider)
    syncCacheProvider.patchSend(engine)
  }
  engine.addProvider(new DefaultFixture({ web3_clientVersion: `SpaceSuit/${version}/javascript` }))
  engine.addProvider(new DefaultBlockParameterSubprovider())
  engine.addProvider(new NonceTrackerSubprovider())
  engine.addProvider(new SanitizingSubprovider())
  engine.addProvider(new CacheSubprovider())
  if (supportsSubscribe) {
    engine.addProvider(new FilterSubprovider({ pendingBlockTimeout: 5000 }))
  } else {
    let subscriptionSubprovider = new SubscriptionSubprovider({ pendingBlockTimeout: 5000 })
    subscriptionSubprovider.on('data', (err, notification) => {
      engine.emit('data', err, notification)
    })
    engine.addProvider(subscriptionSubprovider)
  }
  engine.addProvider(new InflightCacheSubprovider())
  if (config.useHacks) engine.addProvider(new LowerCaseAddressesSubprovider())
  if (config.useHacks) engine.addProvider(new GasPaddingSubprovider())
  engine.addProvider(new SignToPersonalSignSubprovider({ stripPrefix: config.useHacks }))
  engine.addProvider(new MinMaxGasPriceSubprovider({ minGasPrice: config.minGasPrice, maxGasPrice: config.maxGasPrice }))
  let transportPromise = config.transport || TransportU2F.create()
  let ledgerProvider = createLedgerSubprovider(
    transportPromise, {
      accountsOffset: config.accountsOffset,
      accountsLength: config.accountsLength,
      networkId: config.chainId,
      path: config.path
    }
  )
  engine.addProvider(ledgerProvider)
  if (config.useHacks) {
    engine.on('start', () => {
      syncCacheProvider.pollForChanges(ledgerProvider)
      engine.on('stop', () => {
        syncCacheProvider.stopPolling()
      })
    })
  }
  let netSubprovider = networkSubprovider(config.rpcUrl)
  engine.addProvider(netSubprovider)
  if (supportsSubscribe) {
    netSubprovider.on('data', (err, notification) => {
      engine.emit('data', err, notification)
    })
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
  if (!('accountsLength' in config)) config.accountsLength = 10
  if (!('accountsOffset' in config)) config.accountsOffset = 0
  if (config.minGasPrice !== null) config.minGasPrice = parseInt(config.minGasPrice)
  if (config.maxGasPrice !== null) config.maxGasPrice = parseInt(config.maxGasPrice)
}
