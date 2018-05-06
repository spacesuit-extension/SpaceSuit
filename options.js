import React from 'react'
import ReactDOM from 'react-dom'
import AppBar from 'material-ui/AppBar'
import CssBaseline from 'material-ui/CssBaseline'
import Toolbar from 'material-ui/Toolbar'
import Typography from 'material-ui/Typography'
import Radio, { RadioGroup } from 'material-ui/Radio'
import Switch from 'material-ui/Switch'
import { FormLabel, FormControl, FormControlLabel, FormHelperText } from 'material-ui/Form'
import List, {
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
} from 'material-ui/List'
import Button from 'material-ui/Button'
import IconButton from 'material-ui/IconButton'
import Select from 'material-ui/Select'
import Input, { InputLabel } from 'material-ui/Input'
import TextField from 'material-ui/TextField'
import Divider from 'material-ui/Divider'
import Paper from 'material-ui/Paper'
import Snackbar from 'material-ui/Snackbar'
import CloseIcon from '@material-ui/icons/Close'
import { withStyles } from 'material-ui/styles'
import defaultConfig from './default-config.json'
import networkConfigs from './network-configs.json'

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
                <Button onClick={() => this.setState({path: "44'/61'/0'/0"})} color="primary">ETC</Button>{' '}
                <Button onClick={() => this.setState({path: "44'/1'/0'/0"})} color="secondary">Testnet</Button>
              </ListItem>
            </React.Fragment>
            : null
          }
          <Divider />
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
      useHacks: this.state.useHacks
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
