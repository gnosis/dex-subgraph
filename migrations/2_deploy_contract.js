/* global artifacts, error, web3 */

const dependencies = require('@gnosis.pm/dex-contracts/src/migration/dependencies')
const migrateBatchExchange = require('@gnosis.pm/dex-contracts/src/migration/PoC_dfusion')

module.exports = async function(deployer, network, accounts) {
  await dependencies({ artifacts, deployer, network })
  await migrateBatchExchange({ artifacts, deployer, network, accounts, web3 })
}
