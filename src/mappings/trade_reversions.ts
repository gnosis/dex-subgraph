import { log, BigInt, store } from '@graphprotocol/graph-ts'
import { TradeReversion as TradeReversionEvent } from '../../generated/BatchExchange/BatchExchange'
import { toEventId, toPriceId, getBatchId } from '../utils'
import { createSolution, getSolutionById } from './solution'
import { updateOrderOnTradeReversion } from './orders'
import { getBatchById } from './batch'
import { getTradeById } from './trades'

export function onTradeReversion(event: TradeReversionEvent): void {
  let batchId = getBatchId(event).minus(BigInt.fromI32(1))
  let batch = getBatchById(batchId)
  let solution = getSolutionById(batch.solution)!

  // Delete price associated with that trade
  let priceId = toPriceId(event.params.sellToken, batchId)
  log.info('[onTradeReversion] Remove Price: {}', [priceId])
  store.remove('Price', priceId)

  let trades = solution.trades
  if (trades.length === 0) {
    // Since the trivial solution is not accepted by the smart contract,
    // this state must mean trades and solution have already been reverted.
    // in the current transaction
    return
  }

  // Revert all trades
  for (let i = 0; i < trades.length; i++) {
    let tradeId = trades[i]
    log.info('[onTradeReversion] Revert Trade: {}', [tradeId])
    let trade = getTradeById(tradeId)
    trade.revertEpoch = event.block.timestamp
    trade.save()

    updateOrderOnTradeReversion(trade.order, trade)
  }

  // Revert solution
  log.info('[onTradeReversion] Revert Solution: {}', [solution.id])
  solution.revertEpoch = event.block.timestamp
  solution.save()

  // Replace solution on batch
  batch.lastRevertEpoch = event.block.timestamp
  let new_solution = createSolution(toEventId(event), batch, event)
  batch.solution = new_solution.id
  batch.save()
}
