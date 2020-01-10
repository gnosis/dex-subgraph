import { log, BigInt, EthereumEvent } from '@graphprotocol/graph-ts'
import { Trade, Solution, Batch } from '../../generated/schema'
import { createBatchIfNotCreated } from './batch'
import { BatchExchange } from '../../generated/BatchExchange/BatchExchange'
import { createUserIfNotCreated } from './users'

export function createSolutionOrAddTrade(trade: Trade, event: EthereumEvent): Solution {
  let batchId = trade.tradeBatchId
  
  // Make sure the batch is created
  let batch = createBatchIfNotCreated(batchId, event)
  
  // Make sure solution is created  
  let solution = createSolutionIfNotCreated(batch, trade, event)

  // Add trade to current solution
  _addTradeToSolution(solution, trade, event)

  return solution
}

function createSolutionIfNotCreated(batch: Batch, trade: Trade, event: EthereumEvent): Solution {
  let solutionId = batch.solution
  let solution = Solution.load(solutionId)
  
  if (solution == null) {
    // Create solution
    solution = _createSolution(solutionId, trade, batch, event)
  }

  return solution!
}

function _createSolution(solutionId: string, trade: Trade, batch: Batch, event: EthereumEvent): Solution {
  log.info('[createSolution] Create Solution {} for batch {}', [solutionId, batch.id])

  // Get latest solution
  let batchExchange = BatchExchange.bind(event.address);
  let latestSolution = batchExchange.latestSolution()
  let solver = latestSolution.value1
  let feeReward = latestSolution.value2
  let objectiveValue = latestSolution.value3

  // Create user for solver, if not created
  createUserIfNotCreated(solver, event)

  // Create Solution
  let solution = new Solution(solutionId)

  // Relation with the batch and the trades
  solution.batch = batch.id
  solution.trades = []
  
  // Solution details
  solution.solver = solver.toHex()
  solution.feeReward = feeReward
  solution.objectiveValue = objectiveValue
  
  // Audit dates
  solution.createEpoch = event.block.timestamp
  solution.revertEpoch = null

  // Transaction
  solution.txHash = event.transaction.hash
  solution.txLogIndex = event.transactionLogIndex 
  solution.save()
  
  return solution
}

function _addTradeToSolution(solution: Solution, trade: Trade, event: EthereumEvent): void {
  log.info('[addTradeToSolution] Add Trade {} to current Solution for batch {}', [trade.id, solution.batch])

  let trades = solution.trades
  trades.push(trade.id)
  solution.trades = trades
  solution.save()
}