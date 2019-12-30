import { log } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { AddTokenCall } from '../../generated/BatchExchange/BatchExchange'
import { epochToBatchId } from '../utils'

export function onAddToken(call: AddTokenCall): void {
  // Create order
  let address = call.inputs.token
  log.info('[onAddToken] Create Token: {}', [address.toHex()])
  let token = new Token(address.toHex())
  token.address = address
  token.fromBatchId = epochToBatchId(call.block.timestamp)

  // Audit dates
  token.createEpoch = call.block.timestamp
  // cancelEpoch: BigInt!
  // deleteEpoch: BigInt!

  // Transaction
  token.txHash = call.transaction.hash
  
  token.save()
}
