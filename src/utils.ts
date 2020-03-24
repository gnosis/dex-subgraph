import { Address, BigInt, EthereumEvent, EthereumCall } from '@graphprotocol/graph-ts'

let BATCH_TIME = BigInt.fromI32(300)

export function toOrderId(ownerAddress: Address, orderId: i32): string {
  return ownerAddress.toHex() + '-' + BigInt.fromI32(orderId).toString()
}

export function toPriceId(tokenId: i32, batchId: BigInt): string {
  return BigInt.fromI32(tokenId).toString() + '-' + batchId.toString()
}

export function toEventId(event: EthereumEvent): string {
  return event.transaction.hash.toHex() + '-' + event.logIndex.toString()
}

export function batchIdToEpoch(batchId: BigInt): BigInt {
  return batchId.times(BATCH_TIME)
}

export function batchIdToEndOfBatchEpoch(batchId: BigInt): BigInt {
  return batchIdToEpoch(batchId.plus(new BigInt(1)))
}

export function epochToBatchId(epoch: BigInt): BigInt {
  return epoch.div(BATCH_TIME)
}

export function getBatchId(event: EthereumEvent): BigInt {
  return epochToBatchId(event.block.timestamp)
}
