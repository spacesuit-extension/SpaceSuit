import ProviderEngine from "web3-provider-engine";
import DefaultFixture from 'web3-provider-engine/subproviders/default-fixture'
import NonceTrackerSubprovider from 'web3-provider-engine/subproviders/nonce-tracker'
import VmSubprovider from 'web3-provider-engine/subproviders/vm'
import CacheSubprovider from 'web3-provider-engine/subproviders/cache'
import SubscriptionSubprovider from 'web3-provider-engine/subproviders/subscriptions'
import InflightCacheSubprovider from 'web3-provider-engine/subproviders/inflight-cache'
import SanitizingSubprovider from 'web3-provider-engine/subproviders/sanitizer'
import createLedgerSubprovider from "@ledgerhq/web3-subprovider";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import FetchSubprovider from "web3-provider-engine/subproviders/fetch";

import version from './package.json'

const config = {
  blockTime: 15000,
  networkId: 1,
  path: "44'/60'/0'/0",
  rpcUrl: 'http://localhost:8545'
}

const engine = new ProviderEngine({ pollingInterval: config.blockTime });
const getTransport = () => TransportU2F.create();
const ledger = createLedgerSubprovider(getTransport, {
  accountsLength: 10,
  networkId: config.networkId,
  path: config.path
})
let started = false
engine.addProvider(new DefaultFixture({ web3_clientVersion: `SpaceSuit/${version}/javascript` }))
engine.addProvider(new NonceTrackerSubprovider())
engine.addProvider(new VmSubprovider())
engine.addProvider(new SanitizingSubprovider())
engine.addProvider(new CacheSubprovider())
engine.addProvider(new SubscriptionSubprovider({ pendingBlockTimeout: config.blockTime }))
engine.addProvider(new InflightCacheSubprovider())
engine.addProvider(ledger)
engine.addProvider(new FetchSubprovider({ rpcUrl: config.rpcUrl }))
window.web3 = {
  get currentProvider() {
    engine.start()
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
