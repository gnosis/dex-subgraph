import { expect } from 'chai'
import { Mappings } from './wasm'

describe('onSolutionSubmission', function () {
  let mappings: Mappings
  const batchId = 42n
  const solutionId = 'solution'
  const burntFees = 1234n
  const utility = 5678n
  const disregardedUtility = 3456n
  const solver = `0x${'face'.repeat(10)}`

  const timestamp = (batchId + 1n) * 300n + 42n
  const txHash = `0x${'01'.repeat(32)}`

  before(async () => {
    mappings = await Mappings.load()
    mappings.setEntity('Batch', `${batchId}`, {
      id: `${batchId}`,
      startEpoch: batchId * 300n,
      endEpoch: (batchId + 1n) * 300n,
      solution: solutionId,
      firstSolutionEpoch: timestamp,
      lastRevertEpoch: null,
      txHash,
    })
    mappings.setEntity('Solution', solutionId, {
      id: solutionId,
      batch: `${batchId}`,
      solver: `0x${'ff'.repeat(20)}`,
      feeReward: 0n,
      objectiveValue: 0n,
      utility: 0n,
      trades: [],
      createEpoch: timestamp,
      revertEpoch: null,
      txHash,
      txLogIndex: 1n,
    })
    mappings.onSolutionSubmission(
      {
        submitter: solver,
        utility,
        disregardedUtility,
        burntFees,
        lastAuctionBurntFees: 0n,
        prices: [],
        tokenIdsForPrice: [],
      },
      {
        block: { timestamp },
        logIndex: 1,
        transaction: { from: solver, hash: txHash },
      },
    )
  })

  it('populates solution details', async function () {
    const solution = mappings.getEntity('Solution', solutionId)
    expect(solution!.solver).to.equal(solver)
    expect(solution!.utility).to.equal(utility)
    expect(solution!.feeReward).to.equal(burntFees)
    expect(solution!.objectiveValue).to.equal(utility + burntFees - disregardedUtility)
  })
})
