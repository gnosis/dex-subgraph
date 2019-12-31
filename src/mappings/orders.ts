import { BigInt, log } from '@graphprotocol/graph-ts'
import { OrderPlacement as OrderPlacementEvent } from '../../generated/BatchExchange/BatchExchange'
import { Order } from '../../generated/schema'
import { toOrderId, batchIdToEpoch } from '../utils'

export function onOrderPlacement(event: OrderPlacementEvent): void {
  let params = event.params;

  // ID: owner + orderId
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
  order.buyToken = params.buyToken
  order.sellToken = params.sellToken

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
}
