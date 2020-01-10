import { log, BigInt, EthereumEvent } from '@graphprotocol/graph-ts'
import { Batch, Solution } from '../../generated/schema'
import { batchIdToEpoch, batchIdToEndOfBatchEpoch, toEventId } from '../utils'


export function createBatchIfNotCreated(batchId: BigInt, event: EthereumEvent): Batch {
  let id = batchId.toString()
  log.info('[createBatchIfNotCreated] Make sure Batch {} is created', [id])
  // If there's no batch created for the trade, means there's no solution either
  let batch = Batch.load(batchId.toString())
  if (batch == null) {
    let solutionId = toEventId(event)
  
    // Create batch
    batch = _createBatch(batchId, solutionId, event)
  }

  return batch!
}


export function _createBatch(batchId: BigInt, solutionId: string, event: EthereumEvent): Batch {
  let id = batchId.toString()
  log.info('[createBatch] Create Batch {}', [id])
  
  let batch = new Batch(id)

  // batch details
  batch.startEpoch = batchIdToEpoch(batchId)
  batch.endEpoch = batchIdToEndOfBatchEpoch(batchId)
  batch.solution = solutionId

  // Audit Dates
  batch.firstSolutionEpoch = event.block.timestamp
  batch.lastRevertEpoch = null
  batch.txHash = event.transaction.hash
  
  batch.save()
  return batch!
}
