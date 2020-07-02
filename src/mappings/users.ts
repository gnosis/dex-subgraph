import { log, Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { User } from '../../generated/schema'
import { epochToBatchId } from '../utils'

export function createUserIfNotCreated(address: Address, event: ethereum.Event): User {
  let id = address.toHex()
  let user = User.load(id)
  log.info('[createUserIfNotCreated] Get User: {}', [id])
  if (user == null) {
    let timestamp = event.block.timestamp
    let txHash = event.transaction.hash

    user = _createUser(id, timestamp, txHash)
  }

  return user!
}

function _createUser(id: string, timestamp: BigInt, txHash: Bytes): User {
  log.info('[createUser] Create User {}', [id])

  // Create token
  let user = new User(id)
  user.fromBatchId = epochToBatchId(timestamp)

  // Audit dates
  user.createEpoch = timestamp

  // Transaction
  user.txHash = txHash

  user.save()
  return user
}
