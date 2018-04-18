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
import SignToPersonalSignSubprovider from './middleware/sign-to-personal-sign'
import createLedgerSubprovider from "@ledgerhq/web3-subprovider"
import TransportU2F from "@ledgerhq/hw-transport-u2f"
import FetchSubprovider from 'web3-provider-engine/subproviders/fetch'
import InfuraSubprovider from 'web3-provider-engine/subproviders/infura'


import {version} from './package.json'

export function configureEngine(engine, config) {
  return new Promise((resolve, reject) => {
    let networkProvider
    if ('rpcUrl' in config) {
      networkProvider = new FetchSubprovider({ rpcUrl: config.rpcUrl })
    } else {
      networkProvier = new InfuraSubprovider({network: config.infuraNetwork || 'mainnet'})
    }
    networkProvider.handleRequest({
      id: Math.floor(Math.random() * 10 ** 12),
      jsonrpc: '2.0',
      method: 'net_version',
      params: []
    }, null, (error, networkId) => {
      if (error) reject(error)
      else {
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
        engine.addProvider(new SignToPersonalSignSubprovider(config.useHacks))
        engine.addProvider(
          createLedgerSubprovider(
            () => TransportU2F.create(), {
              accountsLength: 10,
              networkId: networkId,
              path: config.path
            }
          )
        )
        engine.addProvider(networkProvider)
        resolve(engine)
      }
    })
  })
}
