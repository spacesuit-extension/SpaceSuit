import Subprovider from 'web3-provider-engine/subproviders/subprovider'


export default class LoggingSubprovider extends Subprovider {
  constructor(opts) {
    super(opts)
  }
  handleRequest(payload, next, end) {
    let id = payload.id
    console.log('Sent', id, payload)
    next((err, result, cb) => {
      if (err) console.error('Error', id, err)
      if (result) console.log('Received', id, result)
      cb()
    })
  }
}
