import ProviderEngine from 'web3-provider-engine'

class AdvancedProviderEngine extends ProviderEngine {
  start() {
    super.start()
    this.emit('start')
  }

  stop() {
    this.emit('stop')
    super.stop()
  }
}

export default AdvancedProviderEngine
