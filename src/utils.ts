import { Address, BigInt, EthereumEvent, EthereumCall } from '@graphprotocol/graph-ts'

let BATCH_TIME = BigInt.fromI32(300)
let OWL_DECIMALS = BigInt.fromI32(18)
let DEFAULT_DECIMALS = BigInt.fromI32(18)
let TEN = BigInt.fromI32(10)

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

export function getOwlDecimals(): BigInt {
  return OWL_DECIMALS
}

export function coalesce<T>(valueOpt: T | null, defaultValue: T): T {
  if (valueOpt == null) {
    return defaultValue
  } else {
    return valueOpt!
  }
}

export function toPriceInUnits(price: BigInt, decimalsBaseOpt: BigInt | null, decimalsQuoteOpt: BigInt | null): BigInt {
  let decimalsBase = coalesce<BigInt>(decimalsBaseOpt, DEFAULT_DECIMALS).toI32()
  let decimalsQuote = coalesce<BigInt>(decimalsQuoteOpt, DEFAULT_DECIMALS).toI32()

  return price.div(TEN.pow(u8(decimalsBase - decimalsQuote)))
}
