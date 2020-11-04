import { log, BigInt } from '@graphprotocol/graph-ts'
import { Trade as TradeEvent } from '../../generated/BatchExchange/BatchExchange'
import { Trade } from '../../generated/schema'
import { toOrderId, toEventId, batchIdToEndOfBatchEpoch, getBatchId } from '../utils'
import { updateOrderOnNewTrade, getOrderById } from './orders'
import { createSolutionOrAddTrade } from './solution'
import { createOrUpdatePrice } from './prices'
import { incrementSellVolume } from './tokens'

export function getTradeById(tradeId: string): Trade {
  let tradeOpt = Trade.load(tradeId)
  if (!tradeOpt) {
    throw new Error("Trade doesn't exist: " + tradeId)
  }
  return tradeOpt!
}

export function getTradesByOrderId(orderId: string): Trade[] {
  let order = getOrderById(orderId)
  return order.trades.map<Trade>((tradeId) => getTradeById(tradeId))
}

export function getTradeInBatchForOrderId(orderId: string, batchId: BigInt): Trade[] {
  return getTradesByOrderId(orderId).filter((trade) => trade.tradeBatchId == batchId)
}

export function getActiveTradeInBatch(orderId: string, batchId: BigInt): Trade | null {
  // Get trades that are not reverted for the current order and batch
  let activeTrades = getTradeInBatchForOrderId(orderId, batchId).filter((trade) => trade.revertEpoch == null)

  switch (activeTrades.length) {
    case 0:
      // No active trade
      return null

    case 1:
      // One active trade
      return activeTrades[1]

    default:
      // For a given order and batch, there can be only one un-reverted order
      throw new Error('The order ' + orderId + ' has more than one active trades in the batch ' + batchId)
  }
}

export function onTrade(event: TradeEvent): void {
  let orderId = toOrderId(event.params.owner, event.params.orderId)

  // Create trade
  let trade = _createTrade(orderId, event)

  // Update prices
  createOrUpdatePrice(event.params.sellToken, trade, event)

  // Update trading volume of token
  incrementSellVolume(event.params.sellToken, event.params.executedSellAmount)

  // Update order (traded amounts totals)
  updateOrderOnNewTrade(orderId, trade)

  // Create solution, or add the trade to the current solution
  createSolutionOrAddTrade(trade, event)
}

function _createTrade(orderId: string, event: TradeEvent): Trade {
  let params = event.params

  // Calculate batchId
  let batchId = getBatchId(event)

  // Get the trade id

  // Uses the eventId as the unique id (tHash + logIndex):
  //    NOTE: we can't use "owner + orderId + batchId" since we want to keep old reverted trades too
  let tradeId = toEventId(event)

  // Create order
  log.info('[onTrade] Create Trade: {}', [tradeId])
  let trade = new Trade(tradeId)

  // Set relationship with order
  trade.order = orderId

  // Trade details
  trade.owner = params.owner.toHex()
  trade.sellVolume = params.executedSellAmount
  trade.buyVolume = params.executedBuyAmount
  // Solutions are submitted always for the previous batch (not the current one)
  // For this reason, we know the trade id is the current batch minus one.
  trade.tradeBatchId = batchId.minus(BigInt.fromI32(1))
  trade.tradeEpoch = batchIdToEndOfBatchEpoch(batchId)

  // Tokens
  let order = getOrderById(orderId)
  trade.buyToken = order.buyToken
  trade.sellToken = order.sellToken

  // Audit dates
  trade.createEpoch = event.block.timestamp
  trade.revertEpoch = null

  // Transaction
  trade.txHash = event.transaction.hash
  trade.txLogIndex = event.transactionLogIndex
  trade.save()

  return trade
}
