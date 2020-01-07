import { BigInt, log } from '@graphprotocol/graph-ts'
import {
  OrderPlacement as OrderPlacementEvent,
  OrderCancelation as OrderCancelationEvent,
  OrderDeletion as OrderDeletionEvent,
  OrderCancelation,
  BatchExchange
} from '../../generated/BatchExchange/BatchExchange'
import { Order, Token, Trade, User } from '../../generated/schema'
import { toOrderId, toOrderIdLegacy, batchIdToEpoch, getBatchId } from '../utils'
import { createTokenIfNotCreated } from './tokens';
import { createUserIfNotCreated } from './users'

export function onOrderPlacement(event: OrderPlacementEvent): void {  
  let params = event.params;

  // Crete user if doesn't exist
  let owner = createUserIfNotCreated(params.owner, event)

  // Crete tokens if they don't exist
  let sellToken = createTokenIfNotCreated(params.sellToken, event)
  let buyToken = createTokenIfNotCreated(params.buyToken, event)

  // Create order
  _createOrder(event, owner, sellToken, buyToken)
}

export function updateOrderOnNewTrade(orderId: string, trade: Trade): void {
  let order = getOrderById(orderId)
  order.soldVolume = order.soldVolume.plus(trade.sellVolume)
  order.boughtVolume = order.boughtVolume.plus(trade.buyVolume)
  order.save()
}

export function onOrderCancelation(event: OrderCancelationEvent): void {
  let params = event.params;
  
  let orderId = toOrderIdLegacy(params.owner, params.id)
  log.info('[onOrderCancelation] Order Cancellation: {}', [orderId])
  let order = getOrderById(orderId)

  if (order.cancelEpoch == null) {
    let batchId = getBatchId(event)
    order.untilBatchId = batchId.minus(new BigInt(1))
    order.untilEpoch = batchIdToEpoch(order.untilBatchId)
    order.cancelEpoch = event.block.timestamp
  } else {
    log.warning("The order {} was already canceled", [orderId])
  }
}


export function onOrderDeletion(event: OrderDeletionEvent): void {
  let params = event.params;
  
  let orderId = toOrderIdLegacy(params.owner, params.id)
  log.info('[onOrderDeletion] Order Deletion: {}', [orderId])
  let order = getOrderById(orderId)

  if (order.deleteEpoch == null) {
    let batchId = getBatchId(event)
    order.untilBatchId = batchId.minus(new BigInt(1))
    order.untilEpoch = batchIdToEpoch(order.untilBatchId)
    order.deleteEpoch = event.block.timestamp
  } else {
    log.warning("The order {} was already deleted", [orderId])
  }
}

export function getOrderById(orderId: string): Order {
  let orderOpt = Order.load(orderId)
  if (!orderOpt) {
    throw new Error("Order doesn't exist: " + orderId)
  }
  return orderOpt!
}

function _createOrder(event: OrderPlacementEvent, owner: User, sellToken: Token, buyToken: Token): Order {
  // ID: owner + orderId
  let params = event.params;
  let id = toOrderId(params.owner, params.index)
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

  // Traded amounts
  order.maxSellAmount = params.priceDenominator
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
