import fs from 'fs'
import path from 'path'

// Contracts to extract the ABI from
const TRUFFLE_CONTRACTS = {
  BatchExchange: '@gnosis.pm/dex-contracts/build/contracts/BatchExchange.json',
  Erc20: '@openzeppelin/contracts/build/contracts/ERC20Detailed.json',
}
const ABI_DIR = path.join(__dirname, '../../abis')

if (!fs.existsSync(ABI_DIR)) {
  fs.mkdirSync(ABI_DIR)
}

for (const [name, truffleContractPath] of Object.entries(TRUFFLE_CONTRACTS)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { contractName, abi } = require(truffleContractPath)
  const file = ABI_DIR + `/${name}.json`
  console.log(`Write "${contractName}" ABI into "${file}"`)
  fs.writeFileSync(file, JSON.stringify(abi, null, 2))
}
