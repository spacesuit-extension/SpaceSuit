# SpaceSuit

SpaceSuit is a Chrome extension that enables Ledger hardware wallet users to use
their hardware wallets with dapps (such as
[CryptoKitties](https://cryptokitties.co),
[ForkDelta](https://forkdelta.github.io) or [Aethia](https://aethia.co) - find
more at [State Of The Dapps](https://www.stateofthedapps.com)).
We aim for bug-for-bug compatibility with MetaMask, so if a Dapp works with
MetaMask but not SpaceSuit, that is a bug in SpaceSuit.

## Staying Safe Online

The world of cryptocurrencies is full of people trying to rob you, cheat you,
scam you, and rip you off. The SpaceSuit project does not have your money, and
can't help you get it back if you lose it, so staying safe is your
responsibility. Here are some tips to help you stay safe:

- **DO NOT CLICK THROUGH CERTIFICATE WARNINGS.** If your browser warns you that
  the certificate for a page isn't valid, do not use it under any circumstances.
- Install the [EtherAddressLookup](https://chrome.google.com/webstore/detail/etheraddresslookup/pdknmigbbbhmllnmgdfalmedcmcefdfn)
  Chrome extension. It can identify and block the most notorious cryptocurrency
  scams.
- The first time you use a dapp, get the URL from an autoritative source,
  such as the project's official Twitter or GitHub page. Don't trust links from
  your search engine, especially sponsored links. Then bookmark it, and only
  ever access the dapp via the bookmark.
- Do not push the button to confirm a transaction on your Ledger wallet unless
  you have checked that the transaction is the one you intended to make. If
  possible, confirm the recipient's address via another channel, such as the
  project's official Twitter account or GitHub page.
- Signing messages can be just as dangerous as signing a transaction. Be just
  as vigilant about requests to sign messages.
- Unless there is a green padlock in the top left of your browser, do not use
  that site.
- Never give out your recovery seed, or any other private key, to anyone. If
  they say they need it, they are lying.
- Install an ad-blocker such as [uBlock Origin](https://github.com/gorhill/uBlock/).
  Malicious ads can attempt to steal from you.
- Unplug your Ledger device when you're not using it.
- If you've got multiple tabs open, and a request to sign a transaction appears
  on your Ledger device, it could have come from any of the tabs. If any of the
  tabs are suspect, close them before making a transaction.
- If your ledger device is plugged in when you're in private browsing mode,
  then it can be used to track you between private and non-private browsing,
  and indeed across computers.
- If you bought your Ledger from anywhere other than the
  [official store (affiliate link)](https://www.ledgerwallet.com/r/dcb8),
  upgrade to the latest firmware, then reset it to generate a new seed.
  If it came with a seed, don't use it - you will lose your money.
- If it looks too good to be true, it probably is.


## Using SpaceSuit

[Get SpaceSuit from the Chrome Store](https://chrome.google.com/webstore/detail/spacesuit/ogonghphdgcdealjfknchhgiaabendkl)

If you don't already have one,
[get a Ledger hardware wallet (affiliate link)](https://www.ledgerwallet.com/r/dcb8).

Before using SpaceSuit, make sure your Ledger device (Nano S and Blue should
both work) is plugged in, has the Ethereum app open, and has both Browser
Support and Contract Data enabled in the app settings.

When you use a dapp, if your Ledger device is connected correctly, it should
know the addresses of the first 10 accounts on your device. Whenever the dapp
wants to send a transaction, or sign a message, you will get a prompt on the
screen of your Ledger device. There will be **no** prompt on your computer
screen, so it is **vitally important** that you check that the details on the
screen match the transaction you want to send.

### Configuration

You can configure SpaceSuit by clicking the icon in you address bar, and
choosing Options. You can choose between Ethereum and Ethereum Classic, and
there are multiple servers to choose for each (the recommended server is
usually the one we've found to be most reliable).

There are also configs for the standard testnets (we don't yet have a
configuration for Morden, because we haven't found a reliable public RPC
server, but please let us know if you know of one), and you can choose a custom
RPC server, such as a Parity or Geth node you are running locally, a
Ganache instance, or a
[QuikNode (affiliate link)](https://www.quiknode.io?tap_a=22610-7a7484&tap_s=273177-1af4f0).

You may notice the "Use Hacks" option. SpaceSuit has a goal of bug-for-bug
compatibility with MetaMask. In some cases, to achieve this, we've had to
reimplement known bugs, deprecated features, and implementation details of
MetaMask, to work around buggy dapps that are in the wild. If you'd prefer not
to do this (or if you're writing a dapp, and want to find any compatbility
bugs), you can turn this setting off.

Finally, the "Debug" option will print all messages between Dapps and SpaceSuit
to the developer console. If you are raising a bug, it will be very useful if
you turn this setting on, and include the output on the developer console with
your bug report.

## Frequently Asked Questions

### How do I view my balance and transfer Ether and Tokens?

We recommend [MyCrypto](https://www.mycrypto.com) or
[MyEtherWallet](https://www.myetherwallet.com) for this. They both already
support Ledger directly, but if you'd prefer to use SpaceSuit,
choose the option to send with "MetaMask/Mist" (in the current version), or
with Web3 (in the latest MyCrypto Beta).

### Is this something to do with MetaMask?

This project is not endorsed by MetaMask in any way. It re-uses a lot of
MetaMask code (don't worry, the MetaMask team allow this - both MetaMask and
SpaceSuit are free and open source), but is not endorsed by them. However,
we endorse MetaMask - their code is excellent, and we recommend it to anyone
who does not need hardware wallet support.

We started writing this project after trying, and failing, to add Ledger support
to MetaMask. This was not MetaMask's fault. Due to some very surprising
security decisions in Chrome, it will be a complex task to add Ledger support to
MetaMask without damaging their security. In the short term, it proved quicker
to write a standalone extension for hardware wallet support. Longer term, we'll
help out with adding hardware wallet support to MetaMask in any way we can.

### Can I use SpaceSuit and MetaMask at the same time?

No. You can have both installed at once, but only one can be enabled at once,
since there is currently no standardised way to have a choice of multiple
blockchain providers.

### Are there any known compatibility issues?

A small number of dapps that work with MetaMask do not work with SpaceSuit:
- Any dapps that don't use SSL can't be supported.
- There are performance issues on OasisDEX that make it unusable (we are
  investigating this).
- SpaceSuit uses a slightly different method to MetaMask to inject its code
  into web pages. We don't know of any dapps that are affected, but in theory,
  dapps with strict content security policies could refuse to allow SpaceSuit.
- Ledger devices don't support signing arbitrary data, or signing typed data,
  so dapps that depend on these (deprecated and experimental, respectively)
  features, can't be made to work with SpaceSuit.

### Can I play Ether Shrimp Farmer?

Unfortunately yes, you can, as of version 0.2.0. Ether Shrimp Farmer is a buggy
mess, and if you want to play it, you'll need to ignore at least one of the
"Staying Safe Online" tips above, so you've got to ask yourself just how
badly you want those Shrimp. But if you're sure you want to play it, use the
[HTTPS version (affiliate link)](https://ethershrimpfarm.net?ref=0x758e53a86224f6511dbcabd9a364e21b4689653f).
But be aware that they don't currently have a valid SSL certificate, and
if you ignore the certificate issues, and they get hacked, you'll get hacked
too.

### Do you offer a bug bounty?

Much as I'd love to, I don't have any money to pay for one. If users are willing
to donate to set one up, I'm happy to do so.

### I miss the Contracts tab of Parity Wallet. Is there anything similar?

I recommend using [Truffle](http://truffleframework.com/) with
[truffle-ledger-provider](https://www.npmjs.com/package/truffle-ledger-provider).

## Developing

You can install most of the dependencies with `yarn install`, but we currently
depend on a modified version of `ledgerjs`, clone
https://github.com/jamespic/ledgerjs into a sibling drectory, and build it
(with `yarn install && yarn run build`) before running `yarn install`.

You can build an unpacked extension (for development) with
`yarn run build`, and build a release build with `yarn run dist`.

We have relatively few unit tests (which you can run with `yarn test`), and rely
more on integration tests. To run our integration tests:

```
cd integration-test
node server.js
```

Then configure SpaceSuit to use http://localhost:1969 as its RPC server, and
navigate to https://localhost:4443.

## Donate

Donations welcome:

- 0x758E53a86224F6511DBcabd9A364E21B4689653F (ETH)
- 0xB276316Be42bb7030ff9483ef93Bc349A37132af (ETC)

You may also want to donate to the following projects, that we rely on:

- **Infura.io:** 0xC48E23C5F6e1eA0BaEf6530734edC3968f79Af2e (ETH)
- **MyEtherWallet.com:** 0xDECAF9CD2367cdbb726E904cD6397eDFcAe6068D (ETH)
- **MyCrypto.com:** 0x4bbeEB066eD09B7AEd07bF39EEe0460DFa261520 (ETH)

We couldn't find a donation address for MetaMask, but we'll add one if we get a
pull request from one of the core team members (yes, we know who they are, so
don't bother chancing it if you're not one of them).

[Privacy Policy](privacy.md)
