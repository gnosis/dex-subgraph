import { BigInt, log } from '@graphprotocol/graph-ts'
import { OrderPlacement as OrderPlacementEvent } from '../../generated/BatchExchange/BatchExchange'
import { Order, Token } from '../../generated/schema'
import { toOrderId, batchIdToEpoch } from '../utils'
import { createTokenIfNotCreated } from './tokens';

export function onOrderPlacement(event: OrderPlacementEvent): void {  
  // Crete tokens if they don't exist
  let sellToken = createTokenIfNotCreated(event.params.sellToken, event)
  let buyToken = createTokenIfNotCreated(event.params.buyToken, event)

  // Create order
  _createOrder(event, sellToken, buyToken)
}

function _createOrder(event: OrderPlacementEvent, sellToken: Token, buyToken: Token): Order {
  // ID: owner + orderId
  let params = event.params;
  let id = toOrderId(params.owner, params.index)
  log.info('[onOrderPlacement] Create Order: {}', [id])
  
  // Create order
  let order = new Order(id)
  order.owner = params.owner
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
  order.soldAmount = BigInt.fromI32(0)

  // Audit dates
  order.createEpoch = event.block.timestamp
  order.cancelEpoch = null
  order.deleteEpoch = null

  // Transaction
  order.txHash = event.transaction.hash
  order.txLogIndex = event.transactionLogIndex 
  
  // Trades
  order.trades = []
  
  order.save()
  return order
}
