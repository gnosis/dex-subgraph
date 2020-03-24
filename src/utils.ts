import { Address, BigInt, log, EthereumEvent } from '@graphprotocol/graph-ts'

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

export function toWei(amount: BigInt, decimalsOpt: BigInt | null): BigInt {
  let decimals = coalesce<BigInt>(decimalsOpt, DEFAULT_DECIMALS).toI32()
  return amount.times(TEN.pow(u8(decimals)))
}

export function greatestCommonDenominator(numerator: BigInt, denominator: BigInt): BigInt {
  if (denominator.isZero()) {
    return numerator
  } else {
    return greatestCommonDenominator(denominator, numerator.mod(denominator))
  }
}

export function reduce(numerator: BigInt, denominator: BigInt): BigInt[] {
  let greatestCommonDenominator = greatestCommonDenominator(numerator, denominator)
  return [numerator.div(greatestCommonDenominator), denominator.div(greatestCommonDenominator)]
}

export function calculatePrice(
  priceNumerator: BigInt, // 1,001997154410.220200000000000000    --- 1001997154410220200000000000000
  priceDenominator: BigInt, // 1                                    --- 1000000000000000000
  decimalsBaseOpt: BigInt | null, // 6
  decimalsQuoteOpt: BigInt | null, // 18
): BigInt[] {
  let decimalsBase = coalesce<BigInt>(decimalsBaseOpt, DEFAULT_DECIMALS).toI32()
  let decimalsQuote = coalesce<BigInt>(decimalsQuoteOpt, DEFAULT_DECIMALS).toI32()
  log.info('[utils:calculatePrice] {} / {} with decimals {} and {}', [
    priceNumerator.toString(),
    priceDenominator.toString(),
    BigInt.fromI32(decimalsBase).toString(),
    BigInt.fromI32(decimalsQuote).toString(),
  ])

  let newNumerator: BigInt
  let newDenominator: BigInt
  if (decimalsBase == decimalsQuote) {
    // Strictly not needed to handle this case separately, but saves a bit of computation to the indexer
    newNumerator = priceNumerator
    newDenominator = priceDenominator
  } else if (decimalsBase > decimalsQuote) {
    newNumerator = priceNumerator.times(TEN.pow(u8(decimalsBase - decimalsQuote)))
    newDenominator = priceDenominator
  } else {
    newNumerator = newNumerator
    newDenominator = priceDenominator.times(TEN.pow(u8(decimalsQuote - decimalsBase)))
  }

  log.info('[utils:calculatePrice] {} / {}', [newNumerator.toString(), newDenominator.toString()])

  return reduce(newNumerator, newDenominator)
}
