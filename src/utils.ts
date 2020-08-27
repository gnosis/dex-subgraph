import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

let BATCH_TIME = BigInt.fromI32(300)
let OWL_DECIMALS = BigInt.fromI32(18)
let DEFAULT_DECIMALS = BigInt.fromI32(18)
let TEN = BigInt.fromI32(10)
let ZERO = BigInt.fromI32(0)

export function toOrderId(ownerAddress: Address, orderId: i32): string {
  return ownerAddress.toHex() + '-' + BigInt.fromI32(orderId).toString()
}

export function toPriceId(tokenId: i32, batchId: BigInt): string {
  return BigInt.fromI32(tokenId).toString() + '-' + batchId.toString()
}

export function toEventId(event: ethereum.Event): string {
  return event.transaction.hash.toHex() + '-' + event.logIndex.toString()
}

export function batchIdToEpoch(batchId: BigInt): BigInt {
  return batchId.times(BATCH_TIME)
}

export function batchIdToEndOfBatchEpoch(batchId: BigInt): BigInt {
  return batchIdToEpoch(batchId.plus(BigInt.fromI32(1)))
}

export function epochToBatchId(epoch: BigInt): BigInt {
  return epoch.div(BATCH_TIME)
}

export function getBatchId(event: ethereum.Event): BigInt {
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
  let gcd = greatestCommonDenominator(numerator, denominator)
  return [numerator.div(gcd), denominator.div(gcd)]
}

/**
 * Calculate the price given twe amounts of two tokens
 *
 * For the market Orange-Apple, we say:
 *   - Orange is the base currency
 *   - Apple is the quote currency
 *   - And the price would be, how many Apples you pay for one Orange
 *
 *
 * @param amountBase Amount in the base token
 * @param decimalsBaseOpt
 * @param amountQuote
 * @param decimalsQuoteOpt
 */
export function calculatePrice(
  amountBase: BigInt,
  decimalsBaseOpt: BigInt | null,
  amountQuote: BigInt,
  decimalsQuoteOpt: BigInt | null,
): BigInt[] {
  let decimalsBase = coalesce<BigInt>(decimalsBaseOpt, DEFAULT_DECIMALS)
  let decimalsQuote = coalesce<BigInt>(decimalsQuoteOpt, DEFAULT_DECIMALS)
  let decimalsDifference = decimalsBase.minus(decimalsQuote)

  // log.info('[utils:calculatePrice] Base: {} ({}) and Quote: {} ({})', [
  //   amountBase.toString(),
  //   decimalsBase.toString(),
  //   amountQuote.toString(),
  //   decimalsQuote.toString(),
  // ])

  let priceNumerator: BigInt
  let priceDenominator: BigInt
  if (decimalsDifference.isZero()) {
    // Strictly not needed to handle this case separately, but saves a bit of computation to the indexer
    priceNumerator = amountQuote
    priceDenominator = amountBase
  } else {
    let precisionFactor = TEN.pow(u8(decimalsDifference.abs().toI32()))
    // log.info('[utils:calculatePrice] precisionFactor: {}', [precisionFactor.toString()])

    // decimalsBase - decimalsQuote < 0?
    if (decimalsDifference.gt(ZERO)) {
      // log.info('[utils:calculatePrice] decimalsBase - decimalsQuote < 0 ? yes', [])
      // Base token has more decimals
      priceNumerator = amountQuote
      priceDenominator = amountBase.times(precisionFactor)
    } else {
      // log.info('[utils:calculatePrice] decimalsBase - decimalsQuote < 0 ? no', [])
      // Quote token has more decimals
      priceNumerator = amountQuote.times(precisionFactor)
      priceDenominator = amountBase
    }
  }

  // log.info('[utils:calculatePrice] Price: {} / {}', [priceNumerator.toString(), priceDenominator.toString()])

  return reduce(priceNumerator, priceDenominator)
}
