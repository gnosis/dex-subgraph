require('babel-register')
require('babel-polyfill')
const HDWalletProvider = require('truffle-hdwallet-provider')

require('dotenv').config()
const assert = require('assert')

const INFURA_API_KEY = process.env.INFURA_API_KEY
assert(INFURA_API_KEY, 'INFURA_API_KEY is required')

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC, `https://rinkeby.infura.io/v3/${INFURA_API_KEY}`)
      },
      network_id: '3',
    },
  },
  compilers: {
    solc: {
      version: '<0.5.7',
    },
  },
}
