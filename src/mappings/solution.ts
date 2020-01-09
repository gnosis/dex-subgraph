import { log, BigInt, EthereumEvent } from '@graphprotocol/graph-ts'
import { Trade } from '../../generated/schema'
import { toEventId } from '../utils'

export function createSolutionOrAddTrade(trade: Trade, event: EthereumEvent): Solution {
  // Get the trade id
  let solutionId = toEventId(event)

  // Create order
  log.info('[createSolutionOrAddTrade] Create Solution: {}', [solutionId])
  // let solution = new Solution(solutionId)

  // // Set relationship with order
  // solution.ba = ba
  
  // // Trade details
  // solution.sellVolume = params.executedSellAmount
  // solution.buyVolume = params.executedBuyAmount
  // solution.tradeBatchId = batchId
  // solution.tradeEpoch = batchIdToEpoch(batchId)

  // // Audit dates
  // solution.createEpoch = event.block.timestamp
  // solution.revertEpoch = null

  // // Transaction
  // solution.txHash = event.transaction.hash
  // solution.txLogIndex = event.transactionLogIndex 
  // solution.save()
  
  // return solution
}

