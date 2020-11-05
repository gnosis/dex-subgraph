import { expect } from 'chai'
import { Mappings } from './wasm'

describe('onTradeReversion', () => {
  const user = `0x${'1337'.repeat(10)}`
  const orderId = 1337
  const orderUid = `${user}-${orderId}`
  const tradeTxHash = `0x${'01'.repeat(32)}`
  const reversionTxHash = `0x${'02'.repeat(32)}`
  const logIndex = 1n
  const tradeTimestamp = 10n * 300n + 42n
  const reversionTimestamp = tradeTimestamp + 42n
  const batchId = tradeTimestamp / 300n - 1n // Trade is recorded for the solved batch
  const tradeId = `${tradeTxHash}-${logIndex}`
  const sellToken = '0'
  const sellVolume = 100000n * 10n ** 18n
  const buyVolume = 500n * 10n ** 18n
  const priceId = `${sellToken}-${batchId}`

  async function createFixturesAndMakeTrade() {
    const mappings = await Mappings.load()

    mappings.setEntity('Token', sellToken, {
      id: sellToken,
      address: `0x${'00'.repeat(20)}`,
      fromBatchId: 0n,
      symbol: 'OWL',
      decimals: 18n,
      name: 'Token OWL',
      sellVolume,
      createEpoch: 0n,
      txHash: tradeTxHash,
    })
    mappings.setEntity('Order', `${user}-${orderId}`, {
      id: orderUid,
      owner: user,
      orderId,
      fromBatchId: 0n,
      fromEpoch: 0n,
      untilBatchId: 42n,
      untilEpoch: 42n * 300n,
      buyToken: '1',
      sellToken,
      priceNumerator: 200000n * 10n ** 18n,
      priceDenominator: 1000n * 10n ** 18n,
      maxSellAmount: 200000n * 10n ** 18n,
      minReceiveAmount: 1000n * 10n ** 18n,
      soldVolume: sellVolume,
      boughtVolume: buyVolume,
      createEpoch: 0n,
      cancelEpoch: null,
      deleteEpoch: null,
      txHash: tradeTxHash,
      txLogIndex: 0n,
    })
    mappings.setEntity('Batch', `${batchId}`, {
      id: `${batchId}`,
      startEpoch: batchId * 300n,
      endEpoch: (batchId + 1n) * 300n,
      solution: tradeId,
      firstSolutionEpoch: tradeTimestamp,
      lastRevertEpoch: null,
      txHash: tradeTxHash,
    })
    mappings.setEntity('Trade', tradeId, {
      id: tradeId,
      order: orderUid,
      owner: user,
      sellVolume: sellVolume,
      buyVolume: buyVolume,
      tradeBatchId: 9n,
      tradeEpoch: 11n * 300n,
      buyToken: '1',
      sellToken,
      createEpoch: tradeTimestamp,
      revertEpoch: null,
      txHash: tradeTxHash,
      txLogIndex: logIndex,
    })
    mappings.setEntity('Solution', tradeId, {
      id: tradeId,
      batch: '9',
      solver: `0x${'00'.repeat(20)}`,
      feeReward: 1337n,
      objectiveValue: 42000n,
      utility: 42n,
      trades: [tradeId],
      createEpoch: tradeTimestamp,
      revertEpoch: null,
      txHash: tradeTxHash,
      txLogIndex: logIndex,
    })
    mappings.setEntity('Price', priceId, {
      id: priceId,
      token: sellToken,
      batchId: 9n,
      priceInOwlNumerator: 1n,
      priceInOwlDenominator: 1n,
      volume: 100000n * 10n ** 18n,
      createEpoch: tradeTimestamp,
      txHash: tradeTxHash,
    })
    mappings.setEntity('Stats', 'latest', {
      id: 'latest',
      volumeInOwl: 1337n * 2000n,
      utilityInOwl: 42n,
      owlBurnt: 1337n,
      settledBatchCount: 1,
      settledTradeCount: 1,
      listedTokens: 2,
    })

    mappings.onTradeReversion(
      {
        owner: user,
        orderId,
        sellToken: 0,
        buyToken: 1,
        executedSellAmount: 100000n * 10n ** 18n,
        executedBuyAmount: 500n * 10n ** 18n,
      },
      {
        block: { timestamp: reversionTimestamp },
        logIndex,
        transaction: { hash: reversionTxHash },
      },
    )

    return mappings
  }

  it('deletes the price', async () => {
    const state = await createFixturesAndMakeTrade()
    const price = state.getEntity('Price', priceId)
    expect(price).to.not.exist
  })

  it('reduces the total sellAmount of the token', async () => {
    const state = await createFixturesAndMakeTrade()
    const token = state.getEntity('Token', sellToken)
    expect(token!.sellVolume).to.equal(0n)
  })

  it('reverts the trade', async () => {
    const state = await createFixturesAndMakeTrade()
    const trade = state.getEntity('Trade', tradeId)
    expect(trade!.revertEpoch).to.equal(reversionTimestamp)
  })

  it('reduces buy/sell volume on order', async () => {
    const state = await createFixturesAndMakeTrade()
    const order = state.getEntity('Order', orderUid)
    expect(order!.soldVolume).to.equal(0n)
    expect(order!.boughtVolume).to.equal(0n)
  })

  it('reverts the solution', async () => {
    const state = await createFixturesAndMakeTrade()
    const solution = state.getEntity('Solution', tradeId)
    expect(solution!.revertEpoch).to.equal(reversionTimestamp)
  })

  it('creates a new solution on the batch', async () => {
    const state = await createFixturesAndMakeTrade()
    const batch = state.getEntity('Batch', `${batchId}`)

    const solutionId = `${reversionTxHash}-${logIndex}`
    expect(batch!.solution).to.equal(solutionId)
    expect(batch!.lastRevertEpoch).to.equal(reversionTimestamp)

    const solution = state.getEntity('Solution', solutionId)
    expect(solution).to.exist
    expect(solution).to.deep.equal({
      id: solutionId,
      batch: '9',
      solver: `0x${'00'.repeat(20)}`,
      feeReward: 0n,
      objectiveValue: 0n,
      utility: 0n,
      trades: [],
      createEpoch: reversionTimestamp,
      revertEpoch: null,
      txHash: reversionTxHash,
      txLogIndex: logIndex,
    })
  })

  it('reverts global trading stats', async () => {
    const state = await createFixturesAndMakeTrade()
    const stats = state.getEntity('Stats', 'latest')
    expect(stats!.volumeInOwl).to.equal(0n)
    expect(stats!.utilityInOwl).to.equal(0n)
    expect(stats!.owlBurnt).to.equal(0n)
    expect(stats!.settledBatchCount).to.equal(0)
    expect(stats!.settledTradeCount).to.equal(0)
  })
})
