import { log, ethereum } from '@graphprotocol/graph-ts'
import { Trade, Solution, Batch } from '../../generated/schema'
import { createBatchIfNotCreated } from './batch'
import { SolutionSubmission as SolutionEvent } from '../../generated/BatchExchange/BatchExchange'
import { createUserIfNotCreated } from './users'
import { getBatchById } from './batch'
import { getBatchId } from '../utils'

export function onSolutionSubmission(event: SolutionEvent): void {
  let batch = getBatchById(getBatchId(event))

  // Solution details
  let solution = getSolutionById(batch.solution)
  solution.solver = event.transaction.from.toHex()
  solution.feeReward = event.params.burntFees
  solution.utility = event.params.utility
  solution.objectiveValue = event.params.utility + event.params.burntFees - event.params.disregardedUtility
  solution.save()
}

export function createSolutionOrAddTrade(trade: Trade, event: ethereum.Event): Solution {
  let batchId = trade.tradeBatchId

  // Make sure the batch is created
  let batch = createBatchIfNotCreated(batchId, event)

  // Make sure solution is created
  let solution = _createSolutionIfNotCreated(batch, event)

  // Add trade to current solution
  _addTradeToSolution(solution, trade, event)

  return solution
}

function _createSolutionIfNotCreated(batch: Batch, event: ethereum.Event): Solution {
  let solutionId = batch.solution
  let solution = Solution.load(solutionId)

  if (solution == null) {
    // Create solution
    solution = createSolution(solutionId, batch, event)
  }

  return solution!
}

export function createSolution(solutionId: string, batch: Batch, event: ethereum.Event): Solution {
  log.info('[createSolution] Create Solution {} for batch {}', [solutionId, batch.id])

  // Create user for solver, if not created
  createUserIfNotCreated(event.transaction.from, event)

  // Create Solution
  let solution = new Solution(solutionId)

  // Relation with the batch and the trades
  solution.batch = batch.id
  solution.trades = []

  // Details will be populated onSolutionSubmission
  solution.solver = null
  solution.feeReward = null
  solution.utility = null
  solution.objectiveValue = null

  // Audit dates
  solution.createEpoch = event.block.timestamp
  solution.revertEpoch = null

  // Transaction
  solution.txHash = event.transaction.hash
  solution.txLogIndex = event.transactionLogIndex
  solution.save()

  return solution
}

export function getSolutionById(solutionId: string): Solution {
  let solution = Solution.load(solutionId)
  if (solution === null) {
    throw new Error(`[getSolutionById] Solution ${solutionId} not found`)
  }

  return solution!
}

function _addTradeToSolution(solution: Solution, trade: Trade, _event: ethereum.Event): void {
  log.info('[addTradeToSolution] Add Trade {} to current Solution for batch {}', [trade.id, solution.batch])

  let trades = solution.trades
  trades.push(trade.id)
  solution.trades = trades
  solution.save()
}
