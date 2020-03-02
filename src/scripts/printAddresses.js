'use strict'

const networksJson = require('@gnosis.pm/dex-contracts/networks.json')
const CONTRACTS = ['BatchExchange']
CONTRACTS.forEach(contractName => {
  const networks = networksJson[contractName]

  console.log(contractName + ':')
  Object.entries(networks).forEach(([networkId, network]) => {
    console.log(`    ${networkId}: ${networks[networkId].address}`)
  })
})
console.log()
