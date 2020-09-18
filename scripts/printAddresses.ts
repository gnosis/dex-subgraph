import networksJson from '@gnosis.pm/dex-contracts/networks.json'

type NetworksJson = Record<string, Record<string, { address: string }>>

const CONTRACTS = ['BatchExchange']
for (const contractName of CONTRACTS) {
  const networks = (networksJson as NetworksJson)[contractName]

  console.log(contractName + ':')
  for (const [networkId, network] of Object.entries(networks)) {
    console.log(`    ${networkId}: ${network.address}`)
  }
}

console.log()
