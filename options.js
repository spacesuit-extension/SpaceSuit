import React from 'react'
import ReactDOM from 'react-dom'
import AppBar from '@material-ui/core/AppBar'
import CssBaseline from '@material-ui/core/CssBaseline'
import Toolbar from '@material-ui/core/Toolbar'
import Typography from '@material-ui/core/Typography'
import Switch from '@material-ui/core/Switch'
import FormControl from '@material-ui/core/FormControl'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import Button from '@material-ui/core/Button'
import IconButton from '@material-ui/core/IconButton'
import Select from '@material-ui/core/Select'
import Input from '@material-ui/core/Input'
import InputAdornment from '@material-ui/core/InputAdornment'
import InputLabel from '@material-ui/core/InputLabel'
import TextField from '@material-ui/core/TextField'
import Divider from '@material-ui/core/Divider'
import Paper from '@material-ui/core/Paper'
import Snackbar from '@material-ui/core/Snackbar'
import CloseIcon from '@material-ui/icons/Close'
import HomeIcon from '@material-ui/icons/Home'
import { withStyles } from '@material-ui/core/styles'
import defaultConfig from './default-config.json'
import networkConfigs from './network-configs.json'
import { homepage_url } from './manifest.json'

require('babel-polyfill')

const styles = theme => ({
  root: theme.mixins.gutters({
    paddingTop: 16,
    paddingBottom: 16,
    margin: theme.spacing.unit * 3,
  }),
  optionGroup: {
    marginBottom: theme.spacing.unit
  },
  gasPrice: {
    marginRight: theme.spacing.unit
  }
})

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

function gweiToWei(gweiText) {
  if (gweiText == '') return null
  else {
    let parsed = parseFloat(gweiText)
    if (isNaN(parsed)) return null
    else return Math.floor(parseFloat(gweiText) * 1e9).toString()
  }

}

function weiToGwei(wei) {
  if (wei != null) return (parseInt(wei) / 1e9).toString()
  else return null
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
      useHacks: config.useHacks,
      minGasPrice: weiToGwei(config.minGasPrice),
      maxGasPrice: weiToGwei(config.maxGasPrice)
    }
  }

  render() {
    return <React.Fragment>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <a href={homepage_url}>
            <IconButton>
              <HomeIcon />
            </IconButton>
          </a>
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
                <Button onClick={() => this.setState({chainId: 1})} color="primary">ETH</Button>{' '}
                <Button onClick={() => this.setState({chainId: 61})} color="primary">ETC</Button>{' '}
                <Button onClick={this.guessChainId.bind(this)} color="secondary">Guess!</Button>
              </ListItem>
              <ListItem>
                <TextField
                    id="path"
                    label="Derivation Path"
                    value={this.state.path}
                    onChange={(e) => this.setState({path: e.target.value})}/>
                <Button onClick={() => this.setState({path: "44'/60'/0'/0"})} color="primary">ETH</Button>{' '}
                <Button onClick={() => this.setState({path: "44'/60'/160720'/0"})} color="primary">ETC</Button>{' '}
                <Button onClick={() => this.setState({path: "44'/1'/0'/0"})} color="secondary">Testnet</Button>
              </ListItem>
            </React.Fragment>
            : null
          }
          <Divider />
          <ListItem>
            <TextField
                id="minGasPrice"
                label="Min Gas Price"
                className={this.props.classes.gasPrice}
                value={this.state.minGasPrice}
                onChange={(e) => this.setState({minGasPrice: e.target.value})}
                InputProps={{
                  endAdornment: <InputAdornment position="end">gwei</InputAdornment>
                }}/>
            <TextField
                id="maxGasPrice"
                label="Max Gas Price"
                className={this.props.classes.gasPrice}
                value={this.state.maxGasPrice}
                onChange={(e) => this.setState({maxGasPrice: e.target.value})}
                InputProps={{
                  endAdornment: <InputAdornment position="end">gwei</InputAdornment>
                }}/>
          </ListItem>
          <ListItem>
            <ListItemText primary="Use Hacks" />
            <ListItemSecondaryAction>
              <Switch
                onChange={() => this.setState({useHacks: !this.state.useHacks})}
                checked={this.state.useHacks}
              />
            </ListItemSecondaryAction>
          </ListItem>
          <ListItem>
            <ListItemText primary="Debug" />
            <ListItemSecondaryAction>
              <Switch
                onChange={() => this.setState({debug: !this.state.debug})}
                checked={this.state.debug}
              />
            </ListItemSecondaryAction>
          </ListItem>
        </List>
        <Button onClick={this.saveConfig.bind(this)} variant="raised" color="primary">Save</Button>
      </Paper>
      <Snackbar
          open={this.state.snackbarVisible}
          autoHideDuration={10000}
          onClose={this.closeSnackBar.bind(this)}
          SnackbarContentProps={{
            'aria-describedby': 'message-id',
          }}
          message={<span id="message-id">{this.state.snackbarMessage}</span>}
          action={[
            <IconButton
              key="close"
              aria-label="Close"
              color="inherit"
              onClick={this.closeSnackBar.bind(this)}
            >
              <CloseIcon />
            </IconButton>,
          ]}
        />
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
    let opts = {
      debug: this.state.debug,
      useHacks: this.state.useHacks,
      minGasPrice: gweiToWei(this.state.minGasPrice),
      maxGasPrice: gweiToWei(this.state.maxGasPrice)
    }
    if (this.state.network === 'Custom') {
      opts.rpcUrl = this.state.rpcUrl
      opts.path = this.state.path
      opts.chainId = this.state.chainId
      opts.infuraNetwork = null
    } else {
      loop:
      for (let networkType in networkConfigs) {
        let networks = networkConfigs[networkType]
        for (let networkName in networks) {
          if (this.state.network === networkName) {
            let network = networks[networkName]
            Object.assign(opts, network)
            break loop
          }
        }
      }
    }
    this.props.saveConfig(opts)
    this.setState({
      snackbarMessage: 'Options updated. You may need to reload open pages for settings to take effect',
      snackbarVisible: true
    })
  }

  closeSnackBar () {
    this.setState({
      snackbarVisible: false
    })
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
