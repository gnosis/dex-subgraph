import { log } from '@graphprotocol/graph-ts'
import { Trade as TradeEvent } from '../../generated/BatchExchange/BatchExchange'
import { Trade, Order } from '../../generated/schema'
import { toOrderId, epochToBatchId, toTradeId, batchIdToEpoch } from '../utils'

export function onTrade(event: TradeEvent): void { 
  let params = event.params;

  // Calculate batchId
  let createEpoch = event.block.timestamp
  let batchId = epochToBatchId(createEpoch)

  // Create order
  let tradeId = toTradeId(params.owner, params.orderId, batchId)
  log.info('[onTrade] Create Trade: {}', [tradeId])
  let trade = new Trade(tradeId)

  // Set relationship with order
  let orderId = toOrderId(params.owner, params.orderId)  
  trade.order = orderId

  // Update order soldAmount
  let orderOpt = Order.load(orderId)
  if (!orderOpt) {
    throw new Error("Order doesn't exist: " + orderId)
  }
  let order = orderOpt!
  let sellVolume = params.executedSellAmount
  let buyVolume = params.executedBuyAmount
  order.soldAmount = order.soldAmount.plus(sellVolume)
  order.save()
  
  // Trade details
  trade.sellVolume = sellVolume
  trade.buyVolume = buyVolume
  trade.tradeBatchId = batchId
  trade.tradeEpoch = batchIdToEpoch(batchId)

  // Audit dates
  trade.createEpoch = createEpoch
  trade.revertEpoch = null

  // Transaction
  trade.txHash = event.transaction.hash
  trade.txLogIndex = event.transactionLogIndex 
  
  trade.save()
}
