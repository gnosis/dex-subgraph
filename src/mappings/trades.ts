import { log } from '@graphprotocol/graph-ts'
import { Trade as TradeEvent } from '../../generated/BatchExchange/BatchExchange'
import { Trade } from '../../generated/schema'
import { toOrderId, epochToBatchId, toTradeId, batchIdToEpoch } from '../utils'
import { updateOrderOnNewTrade } from './orders';

export function onTrade(event: TradeEvent): void {   
  let orderId = toOrderId(event.params.owner, event.params.orderId)  

  // Create trade
  let trade = _createTrade(orderId, event)

  // Update order
  updateOrderOnNewTrade(orderId, trade)
}

function _createTrade(orderId: string, event: TradeEvent): Trade {
  let params = event.params;
  
  // Calculate batchId
  let createEpoch = event.block.timestamp
  let batchId = epochToBatchId(createEpoch)

  // Create order
  let tradeId = toTradeId(params.owner, params.orderId, batchId)
  log.info('[onTrade] Create Trade: {}', [tradeId])
  let trade = new Trade(tradeId)

  // Set relationship with order
  trade.order = orderId
  
  // Trade details
  trade.sellVolume = params.executedSellAmount
  trade.buyVolume = params.executedBuyAmount
  trade.tradeBatchId = batchId
  trade.tradeEpoch = batchIdToEpoch(batchId)

  // Audit dates
  trade.createEpoch = createEpoch
  trade.revertEpoch = null

  // Transaction
  trade.txHash = event.transaction.hash
  trade.txLogIndex = event.transactionLogIndex 
  
  trade.save()
  return trade
}
