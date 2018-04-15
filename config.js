import DefaultFixture from 'web3-provider-engine/subproviders/default-fixture'
import DefaultBlockParameterSubprovider from './middleware/default-block-parameter'
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker'
import CacheSubprovider from 'web3-provider-engine/subproviders/cache'
import SubscriptionSubprovider from 'web3-provider-engine/subproviders/subscriptions'
import InflightCacheSubprovider from 'web3-provider-engine/subproviders/inflight-cache'
import SanitizingSubprovider from 'web3-provider-engine/subproviders/sanitizer'
import LowerCaseAddressesSubprovider from './middleware/lowercase-addresses'
import LoggingSubprovider from './middleware/logging'
import EstimateGasSubprovider from './middleware/estimate-gas'
import createLedgerSubprovider from "@ledgerhq/web3-subprovider"
import TransportU2F from "@ledgerhq/hw-transport-u2f"
import FetchSubprovider from 'web3-provider-engine/subproviders/fetch'
import InfuraSubprovider from 'web3-provider-engine/subproviders/infura'


import {version} from './package.json'

export function configureEngine(engine, config) {
  if (config.debug) {
    engine.addProvider(new LoggingSubprovider())
  }
  engine.addProvider(new DefaultFixture({ web3_clientVersion: `SpaceSuit/${version}/javascript` }))
  engine.addProvider(new DefaultBlockParameterSubprovider())
  engine.addProvider(new NonceTrackerSubprovider())
  engine.addProvider(new SanitizingSubprovider())
  engine.addProvider(new CacheSubprovider())
  engine.addProvider(new SubscriptionSubprovider({ pendingBlockTimeout: config.blockTime }))
  engine.addProvider(new InflightCacheSubprovider())
  engine.addProvider(new LowerCaseAddressesSubprovider())
  engine.addProvider(new EstimateGasSubprovider())
  engine.addProvider(
    createLedgerSubprovider(
      () => TransportU2F.create(), {
        accountsLength: 10,
        networkId: config.networkId,
        path: config.path
      }
    )
  )
  if ('rpcUrl' in config) {
    engine.addProvider(new FetchSubprovider({ rpcUrl: config.rpcUrl }))
  } else {
    engine.addProvider(new InfuraSubprovider({network: config.infuraNetwork || 'mainnet'}))
  }
}
