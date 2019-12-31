import { log, Address, BigInt, Bytes } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { AddTokenCall } from '../../generated/BatchExchange/BatchExchange'
import { epochToBatchId } from '../utils'

export function onAddToken(call: AddTokenCall): void {
  let address = call.inputs.token
  let timestamp = call.block.timestamp
  let txHash = call.transaction.hash
  createToken(address, timestamp, txHash)
}


export function createToken(address: Address, timestamp: BigInt, txHash: Bytes): void {
  // Create token
  log.info('[onAddToken] Create Token: {}', [address.toHex()])
  let token = new Token(address.toHex())
  token.address = address
  token.fromBatchId = epochToBatchId(timestamp)

  // Audit dates
  token.createEpoch = timestamp

  // Transaction
  token.txHash = txHash

  token.save()
}