import React from 'react'
import ReactDOM from 'react-dom'
import AppBar from 'material-ui/AppBar'
import CssBaseline from 'material-ui/CssBaseline'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import Radio, { RadioGroup } from 'material-ui/Radio'
import { FormLabel, FormControl, FormControlLabel, FormHelperText } from 'material-ui/Form'
import List, {
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
} from 'material-ui/List'
import Button from 'material-ui/Button'
import Select from 'material-ui/Select'
import Input, { InputLabel } from 'material-ui/Input'
import TextField from 'material-ui/TextField'
import Paper from 'material-ui/Paper'
import { withStyles } from 'material-ui/styles'
import * as defaultConfig from './default-config.json'

require('babel-polyfill')

const styles = theme => ({
  root: theme.mixins.gutters({
    paddingTop: 16,
    paddingBottom: 16,
    margin: theme.spacing.unit * 3,
  }),
  optionGroup: {
    marginBottom: theme.spacing.unit
  }
})

const ethPath = "44'/60'/0'/0"
const etcPath = "44'/61'/0'/0"
const testnetPath = "44'/1'/0'/0"

const networkConfigs = {
  'Ethereum (ETH)': {
    'Infura (Recommended)': {
      infuraNetwork: 'mainnet',
      chainId: 1,
      path: ethPath
    },
    'MyCryptoAPI': {
      rpcUrl: 'https://api.myetherapi.com/eth',
      chainId: 1,
      path: ethPath
    },
    'Blockscale': {
      rpcUrl: 'https://api.dev.blockscale.net/dev/parity',
      chainId: 1,
      path: ethPath
    }
  },
  'Ethereum Classic (ETC)': {
    'Ethereum Commonwealth': {
      rpcUrl: 'https://etc-geth.0xinfra.com',
      chainId: 61,
      path: etcPath
    }
  },
  'Testnet': {
    'Infura Ropsten': {
      infuraNetwork: 'ropsten',
      chainId: 3,
      path: testnetPath,
    },
    'Infura Kovan': {
      infuraNetwork: 'kovan',
      chainId: 42,
      path: testnetPath
    },
    'Infura Rinkeby': {
      infuraNetwork: 'rinkeby',
      chainId: 4,
      path: testnetPath
    }
  },
  'Other': {
    'Custom': {
      infuraNetwork: undefined
    }
  }
}

function identifyNetworkFromConfig (config) {
  for (let networkType in networkConfigs) {
    let networks = networkConfigs[networkType]
    for (let networkName in networks) {
      let network = networks[networkName]
      let matches = true
      for (let propertyName in network) {
        matches = matches && (config[propertyName] == network[propertyName])
      }
      if (matches) return networkName
    }
  }
}

async function guessChainId (rpcUrl, cb) {
  try {
    let res = await window.fetch(rpcUrl, {
      method: 'POST',
      body: '{"jsonrpc": "2.0", "method": "net_version", "params": [], "id": 1}',
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    })
    let jsonResult = await res.json()
    cb(parseInt(jsonResult.result))
  } catch (e) {
    console.error(e)
  }
}

class OptionsMenu extends React.Component {
  constructor ({config}) {
    super()
    this.state = {
      network: identifyNetworkFromConfig(config),
      rpcUrl: config.rpcUrl,
      chainId: config.chainId,
      path: config.path,
      debug: config.debug,
      useHacks: config.useHacks
    }
  }

  render() {
    return <React.Fragment>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="title" color="inherit">
            SpaceSuit Options
          </Typography>
        </Toolbar>
      </AppBar>
      <Paper className={this.props.classes.root}>
        <Typography variant="title">Options</Typography>
        <List>
          <ListItem>
            <FormControl>
              <InputLabel htmlFor="network">Network</InputLabel>
              <Select
                  native
                  value={this.state.network}
                  onChange={this.changeNetwork.bind(this)}
                  input={<Input id="network" />}>
                {Object.keys(networkConfigs).map(networkType => {
                  let typeGroup = networkConfigs[networkType]
                  return <optgroup label={networkType}>
                    {Object.keys(typeGroup).map(network => <option value={network}>{network}</option>)}
                  </optgroup>
                })}
              </Select>
            </FormControl>
          </ListItem>
          {
            (this.state.network === 'Custom')
            ? <React.Fragment>
              <ListItem>
                <TextField
                    id="rpcUrl"
                    label="RPC URL"
                    value={this.state.rpcUrl}
                    onChange={(e) => this.setState({rpcUrl: e.target.value})}/>
              </ListItem>
              <ListItem>
                <TextField
                    id="chainId"
                    label="Chain Id"
                    type="number"
                    value={this.state.chainId}
                    onChange={(e) => this.setState({chainId: parseInt(e.target.value)})}/>
                <Button onClick={() => this.setState({chainId: 1})}>ETH</Button>
                <Button onClick={() => this.setState({chainId: 61})}>ETC</Button>
                <Button onClick={this.guessChainId.bind(this)}>Guess!</Button>
              </ListItem>
              <ListItem>
                <TextField
                    id="path"
                    label="Derivation Path"
                    value={this.state.path}
                    onChange={(e) => this.setState({path: e.target.value})}/>
                <Button onClick={() => this.setState({path: ethPath})}>ETH</Button>
                <Button onClick={() => this.setState({path: etcPath})}>ETC</Button>
                <Button onClick={() => this.setState({path: testnetPath})}>Testnet</Button>
              </ListItem>
            </React.Fragment>
            : null
          }
        </List>
      </Paper>
    </React.Fragment>
  }

  changeNetwork (e) {
    let newState = { network: e.target.value }
    if (newState.network === 'Custom') {
      if (!this.state.rpcUrl) newState.rpcUrl = 'http://localhost:8545'
    }
    this.setState(newState)
  }

  guessChainId () {
    this.props.guessChainId(this.state.rpcUrl, (i) => this.setState({chainId: i}))
  }

  saveConfig () {

  }
}

const StyledOptionsMenu = withStyles(styles)(OptionsMenu)

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
