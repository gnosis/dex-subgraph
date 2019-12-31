'use strict'

const fs = require('fs')
const path = require('path')

// Contracts to extract the ABI from
const TRUFFLE_CONTRACTS = [
  '@gnosis.pm/dex-contracts/build/contracts/BatchExchange.json',
  'openzeppelin-solidity/build/contracts/ERC20.json'
]
var ABI_DIR = path.join(__dirname, '../../abis')

if (!fs.existsSync(ABI_DIR)) {
  fs.mkdirSync(ABI_DIR)
}
for (const truffleContractPath of TRUFFLE_CONTRACTS) {
  const { contractName, abi } = require(truffleContractPath)
  const file = ABI_DIR + `/${contractName}.json`
  console.log('Write ABI: ' + file)
  fs.writeFileSync(file, JSON.stringify(abi, null, 2))
}
