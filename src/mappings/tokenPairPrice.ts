import { BigInt, log } from '@graphprotocol/graph-ts'
import { Order, Token, Trade, User } from '../../generated/schema'
import { toPriceId, batchIdToEpoch } from '../utils'

export function updatePriceOnNewTrade(trade: Trade): void {
  let priceId = toPriceId(trade.)
  let price = getPriceById(priceId)


  price.soldVolume = price.soldVolume.plus(trade.sellVolume)
  price.boughtVolume = price.boughtVolume.plus(trade.buyVolume)
  price.save()
}

export function getPriceById(priceId: string): Order {
  let priceOpt = Order.load(priceId)
  if (!priceOpt) {
    throw new Error("Price doesn't exist: " + priceId)
  }
  return priceOpt!
}

function _createPrice(event: OrderPlacementEvent, owner: User, sellToken: Token, buyToken: Token): Order {
  let params = event.params
  let id = toPriceId(params.owner, params.index)
  log.info('[onOrderPlacement] Create Order: {}', [id])

  // Create order
  let order = new Order(id)
  order.owner = owner.id
  order.orderId = params.index

  // Validity
  order.fromBatchId = params.validFrom
  order.fromEpoch = batchIdToEpoch(params.validFrom)
  order.untilBatchId = params.validUntil
  order.untilEpoch = batchIdToEpoch(params.validUntil)

  // Tokens
  order.sellToken = sellToken.id
  order.buyToken = buyToken.id

  // Price
  order.priceNumerator = params.priceNumerator
  order.priceDenominator = params.priceDenominator

  // Sell amount and receive amount
  order.maxSellAmount = params.priceDenominator
  order.minReceiveAmount = params.priceNumerator

  // Traded amounts
  order.soldVolume = BigInt.fromI32(0)
  order.boughtVolume = BigInt.fromI32(0)

  // Audit dates
  order.createEpoch = event.block.timestamp
  order.cancelEpoch = null
  order.deleteEpoch = null

  // Transaction
  order.txHash = event.transaction.hash
  order.txLogIndex = event.transactionLogIndex

  order.save()
  return order
}
