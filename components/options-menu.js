import React from 'react'
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
import HelpIcon from '@material-ui/icons/Help'
import { withStyles } from '@material-ui/core/styles'
import networkConfigs from '../network-configs.json'
import pathTypes from '../path-types.json'
import { homepage_url } from '../manifest.json'
import { normaliseConfig } from '../lib/config.js'

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
  numberField: {
    marginRight: theme.spacing.unit
  }
})

export function identifyNetworkFromConfig (config) {
  normaliseConfig(config)
  let path = config.path
  for (let networkType in networkConfigs) {
    let networks = networkConfigs[networkType]
    for (let networkName in networks) {
      let network = networks[networkName]
      if (
        config.rpcUrl != null && config.rpcUrl === network.rpcUrl
      ) {
        let pathType = network.pathType
        let pathStyles = pathTypes[pathType]
        for (let pathStyle in pathStyles) {
          if (path === pathStyles[pathStyle]) {
            return {network: networkName, pathStyle}
          }
        }
      }
    }
  }
  return {network: "Custom", pathStyle: "ledger_old"}
}

function gweiToWei(gweiText) {
  if (gweiText == '') return null
  else {
    let parsed = parseFloat(gweiText)
    if (Number.isNaN(parsed)) return null
    else return Math.floor(parseFloat(gweiText) * 1e9).toString()
  }

}

function weiToGwei(wei) {
  if (wei != null) return (parseInt(wei) / 1e9)
  else return null
}

function gasPriceValid(gasPriceGwei) {
  return !Number.isNaN(parseFloat(gasPriceGwei)) || gasPriceGwei === '' || gasPriceGwei === null
}

function numberValid(n) {
  return /^\d+$/.test(n)
}

export class OptionsMenu extends React.Component {
  constructor ({config}) {
    super()
    let {network, pathStyle} = identifyNetworkFromConfig(config)
    this.state = {
      network,
      pathStyle,
      rpcUrl: config.rpcUrl,
      chainId: config.chainId,
      path: config.path,
      debug: config.debug,
      useHacks: config.useHacks,
      minGasPrice: weiToGwei(config.minGasPrice),
      maxGasPrice: weiToGwei(config.maxGasPrice),
      accountsOffset: config.accountsOffset,
      accountsLength: config.accountsLength
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
          <a href={homepage_url}
              onClick={() => chrome.tabs.create({url: homepage_url})}>
            <IconButton>
              <HelpIcon />
            </IconButton>
          </a>
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
                  id="networkSelect"
                  value={this.state.network}
                  onChange={this.changeNetwork.bind(this)}
                  input={<Input id="network" />}>
                {Object.keys(networkConfigs).map(networkType => {
                  let typeGroup = networkConfigs[networkType]
                  return <optgroup label={networkType} key={networkType}>
                    {Object.keys(typeGroup).map(network => <option value={network} key={network}>{network}</option>)}
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
                    error={!numberValid(this.state.chainId)}
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
                <Button onClick={() => this.setState({path: "44'/60'/0'/x"})} color="primary">ETH</Button>{' '}
                <Button onClick={() => this.setState({path: "44'/60'/160720'/0'/x"})} color="primary">ETC</Button>{' '}
                <Button onClick={() => this.setState({path: "44'/1'/0'/x"})} color="secondary">Testnet</Button>
              </ListItem>
            </React.Fragment>
            : <ListItem>
              <FormControl>
                <InputLabel htmlFor="path-style">Path Style</InputLabel>
                <Select
                    native
                    id="pathStyleSelect"
                    value={this.state.pathStyle}
                    onChange={this.changePathStyle.bind(this)}
                    input={<Input id="path-style" />}>
                  <option value="ledger_old">Ledger Legacy (Chrome App Compatible)</option>
                  <option value="ledger_new">Ledger New (Ledger Live Compatible)</option>
                  <option value="compat">EIP 84 (Trezor Compatible)</option>
                </Select>
              </FormControl>
            </ListItem>
          }
          <Divider />
          <ListItem>
            <TextField
                id="accountsOffset"
                label="First Account"
                className={this.props.classes.numberField}
                type="number"
                value={this.state.accountsOffset}
                error={!numberValid(this.state.accountsOffset)}
                onChange={(e) => this.setState({accountsOffset: e.target.value})}/>
            <TextField
                id="accountsLength"
                label="Number Of Accounts"
                className={this.props.classes.numberField}
                type="number"
                value={this.state.accountsLength}
                error={!numberValid(this.state.accountsLength)}
                onChange={(e) => this.setState({accountsLength: e.target.value})}/>
          </ListItem>
          <ListItem>
            <TextField
                id="minGasPrice"
                label="Min Gas Price"
                className={this.props.classes.numberField}
                value={this.state.minGasPrice}
                error={!gasPriceValid(this.state.minGasPrice)}
                onChange={(e) => this.setState({minGasPrice: e.target.value})}
                InputProps={{
                  endAdornment: <InputAdornment position="end">gwei</InputAdornment>
                }}/>
            <TextField
                id="maxGasPrice"
                label="Max Gas Price"
                className={this.props.classes.numberField}
                value={this.state.maxGasPrice}
                error={!gasPriceValid(this.state.maxGasPrice)}
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
        <Button
          id="saveButton"
          onClick={this.saveConfig.bind(this)}
          variant="raised"
          color="primary" disabled={!this.valid()}>Save</Button>
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
    let newNetwork = e.target.value
    let newState = { network: e.target.value }
    if (newNetwork !== 'Custom') {
      loop:
      for (let networkType in networkConfigs) {
        let networks = networkConfigs[networkType]
        for (let networkName in networks) {
          if (newNetwork === networkName) {
            let network = networks[networkName]
            Object.assign(newState, network)
            newState.path = pathTypes[network.pathType][this.state.pathStyle]
            break loop
          }
        }
      }
    } else {
      if (!this.state.rpcUrl) newState.rpcUrl = 'http://localhost:8545'
    }
    this.setState(newState)
  }

  changePathStyle (e) {
    let pathStyle = e.target.value
    let path = pathTypes[this.state.pathType][pathStyle]
    this.setState({path, pathStyle})
  }

  guessChainId () {
    this.props.guessChainId(this.state.rpcUrl, (i) => this.setState({chainId: i}))
  }

  valid() {
    return numberValid(this.state.accountsLength)
      && numberValid(this.state.accountsOffset)
      && numberValid(this.state.chainId)
      && gasPriceValid(this.state.minGasPrice)
      && gasPriceValid(this.state.maxGasPrice)
  }

  saveConfig () {
    if (!this.valid()) return
    let opts = {
      debug: this.state.debug,
      useHacks: this.state.useHacks,
      rpcUrl: this.state.rpcUrl,
      path: this.state.path,
      chainId: this.state.chainId,
      minGasPrice: gweiToWei(this.state.minGasPrice),
      maxGasPrice: gweiToWei(this.state.maxGasPrice),
      accountsOffset: parseInt(this.state.accountsOffset),
      accountsLength: parseInt(this.state.accountsLength),
      lastChanged: +new Date()
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

export const StyledOptionsMenu = withStyles(styles)(OptionsMenu)

export default StyledOptionsMenu
