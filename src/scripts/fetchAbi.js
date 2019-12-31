'use strict'

const fs = require('fs')
const path = require('path')

// Contracts to extract the ABI from
const TRUFFLE_CONTRACTS = {
  BatchExchange: '@gnosis.pm/dex-contracts/build/contracts/BatchExchange.json',
  ERC20: 'openzeppelin-solidity/build/contracts/ERC20Detailed.json'
}
var ABI_DIR = path.join(__dirname, '../../abis')

if (!fs.existsSync(ABI_DIR)) {
  fs.mkdirSync(ABI_DIR)
}
for (const [name, truffleContractPath] of Object.entries(TRUFFLE_CONTRACTS)) {
  const { contractName, abi } = require(truffleContractPath)
  const file = ABI_DIR + `/${name}.json`
  console.log(`Write "${contractName}" ABI into "${file}"`)
  fs.writeFileSync(file, JSON.stringify(abi, null, 2))
}
