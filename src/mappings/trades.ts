import { log, BigInt } from '@graphprotocol/graph-ts'
import { Trade as TradeEvent, TradeReversion as TradeReversionEvent } from '../../generated/BatchExchange/BatchExchange'
import { Trade } from '../../generated/schema'
import { toOrderId, toEventId, batchIdToEndOfBatchEpoch, getBatchId } from '../utils'
import { updateOrderOnNewTrade, getOrderById, updateOrderOnTradeReversion } from './orders'
import { createSolutionOrAddTrade } from './solution'
import { createOrUpdatePrice } from './prices'

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

let _tradeFilterBatchId = BigInt.fromI32(-1)
export function getTradeInBatchForOrderId(orderId: string, batchId: BigInt): Trade[] {
  // NOTE: It appears that AssemblyScript does not yet fully implement closures.
  // Even more so in the version being used by the Graph CLI. Specifically, the
  // captured variable has no value (this can be verified by uncommenting out
  // the log line to see that the captured `batchId` value is indeed `null`). To
  // work around this issue, create a global variable for holding the batch ID
  // being filtered for (🤮) and use that instead. Since Wasm is currently
  // single threaded, this is not an issue yet. Unfortunately, there is not
  // compiler error for capturing a variable, so its just something to watch out
  // for.
  _tradeFilterBatchId = batchId
  return getTradesByOrderId(orderId).filter((trade) => {
    //log.debug('batchId == {}', [batchId == null ? 'null' : batchId.toString()])
    return trade.tradeBatchId == _tradeFilterBatchId
  })
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
      return activeTrades[0]

    default:
      // For a given order and batch, there can be only one un-reverted order
      throw new Error('The order ' + orderId + ' has more than one active trades in the batch ' + batchId)
  }
}

export function onTrade(event: TradeEvent): void {
  let orderId = toOrderId(event.params.owner, event.params.orderId)

  // Create trade
  let trade = _createTrade(orderId, event)

  // Update traces
  createOrUpdatePrice(event.params.sellToken, trade, event)

  // Update order (traded amounts totals)
  updateOrderOnNewTrade(orderId, trade)

  // Create solution, or add the trade to the current solution
  createSolutionOrAddTrade(trade, event)
}

export function onTradeReversion(event: TradeReversionEvent): void {
  let orderId = toOrderId(event.params.owner, event.params.orderId)
  log.info('[onTradeReversion] New Trade Reversion for orderId {}', [orderId])

  // Update trade reversion epoch
  let trade = _revertTrade(orderId, event)

  // Update order (traded amounts totals)
  updateOrderOnTradeReversion(orderId, trade)

  log.info('[onTradeReversion] Reverted trade {}', [trade.id])
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

function _revertTrade(orderId: string, event: TradeReversionEvent): Trade {
  // Get the trade that need to be reverted (only one that is active in the batch)
  let batchId = getBatchId(event)
  let tradeBatchId = batchId.minus(BigInt.fromI32(1))
  let trade = getActiveTradeInBatch(orderId, tradeBatchId)
  if (trade == null) {
    // If the contract emit a revert it should be
    throw new Error('The order ' + orderId + " doesn't have any active trade to revert")
  }

  // Set the revert date for the active order
  trade.revertEpoch = event.block.timestamp
  trade.save()

  return trade!
}
