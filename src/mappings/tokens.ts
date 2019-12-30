import { Token } from '../../generated/schema'
import { AddTokenCall } from '../../generated/BatchExchange/BatchExchange'
import { epochToBatchId } from '../utils'

export function onAddToken(call: AddTokenCall): void {
  // Create order
  let address = call.inputs.token
  let token = new Token(address.toHex())
  token.address = address
  token.fromBatchId = epochToBatchId(call.block.timestamp)

  // Audit dates
  token.createEpoch = call.block.timestamp
  // cancelEpoch: BigInt!
  // deleteEpoch: BigInt!
  
  token.save()
}
