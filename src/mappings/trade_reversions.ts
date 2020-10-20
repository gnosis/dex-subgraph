import { log, BigInt, store } from '@graphprotocol/graph-ts'
import { TradeReversion as TradeReversionEvent } from '../../generated/BatchExchange/BatchExchange'
import { Batch, Solution, Trade } from '../../generated/schema'
import { toPriceId, getBatchId } from '../utils'
import { createSolutionIfNotCreated } from './solution'
import { updateOrderOnTradeReversion } from './orders'

export function onTradeReversion(event: TradeReversionEvent): void {
  let batchId = getBatchId(event).minus(BigInt.fromI32(1))
  let batch = Batch.load(batchId.toString())!
  let solution = Solution.load(batch.solution)!

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
    let trade = Trade.load(tradeId)!
    trade.revertEpoch = event.block.timestamp
    trade.save()

    updateOrderOnTradeReversion(trade.order, event)
  }

  // Revert solution
  log.info('[onTradeReversion] Revert Solution: {}', [solution.id])
  solution.revertEpoch = event.block.timestamp
  solution.save()

  // Replace solution on batch
  batch.lastRevertEpoch = event.block.timestamp
  let new_solution = createSolutionIfNotCreated(batch, event)
  batch.solution = new_solution.id
  batch.save()
}
