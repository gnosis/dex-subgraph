import { BigInt, log } from '@graphprotocol/graph-ts'
import { OrderPlacement as OrderPlacementEvent } from '../../generated/BatchExchange/BatchExchange'
import { Order } from '../../generated/schema'
import { toOrderId, batchIdToEpoch } from '../utils'

export function onOrderPlacement(event: OrderPlacementEvent): void {
  // ID: owner + orderId
  let id = toOrderId(event.params.owner, event.params.index)
  log.info('[onOrderPlacement] Create Order: {}', [id])
  
  // Create order
  let order = new Order(id)
  order.owner = event.params.owner
  order.orderId = event.params.index

  // Validity
  order.fromBatchId = event.params.validFrom
  order.fromEpoch = batchIdToEpoch(event.params.validFrom)
  order.untilBatchId = event.params.validUntil
  order.untilEpoch = batchIdToEpoch(event.params.validUntil)

  // Tokens
  order.buyToken = event.params.buyToken
  order.sellToken = event.params.sellToken

  // Price
  order.priceNumerator = event.params.priceNumerator
  order.priceDenominator = event.params.priceDenominator

  // Traded amounts
  order.maxSellAmount = event.params.priceDenominator
  order.soldAmount = BigInt.fromI32(0)

  // Audit dates
  order.createEpoch = event.block.timestamp
  // cancelEpoch: BigInt!
  // deleteEpoch: BigInt!

  // Transaction
  order.txHash = event.transaction.hash
  order.txLogIndex = event.transactionLogIndex 
  
  // Trades
  // TODO: trades
  
  order.save()
}
