import { expect } from 'chai'
import { Mappings } from './wasm'
import { ValueKind } from './wasm/runtime/ethereum'

describe('onTrade', function () {
  let mappings: Mappings

  const user = `0x${'1337'.repeat(10)}`
  const orderId = 1337n
  const orderUid = `${user}-${orderId}`
  const txHash = `0x${'01'.repeat(32)}`
  const logIndex = 1n
  const timestamp = 10n * 300n + 42n
  const tradeId = `${txHash}-${logIndex}`

  before(async () => {
    mappings = await Mappings.load()

    mappings.setEntity('Token', '0', {
      id: '0',
      address: `0x${'00'.repeat(20)}`,
      fromBatchId: 0n,
      symbol: 'OWL',
      decimals: 18n,
      name: 'Token OWL',
      createEpoch: 0n,
      txHash: `0x${'00'.repeat(32)}`,
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
      sellToken: '0',
      priceNumerator: 200000n * 10n ** 18n,
      priceDenominator: 1000n * 10n ** 18n,
      maxSellAmount: 200000n * 10n ** 18n,
      minReceiveAmount: 1000n * 10n ** 18n,
      soldVolume: 0n,
      boughtVolume: 0n,
      createEpoch: 0n,
      cancelEpoch: null,
      deleteEpoch: null,
      txHash: `0x${'00'.repeat(32)}`,
      txLogIndex: 0n,
    })
    mappings.setCallHandler((call) => {
      const callName = `${call.contractName}.${call.functionName}`
      switch (callName) {
        case 'BatchExchange.currentPrices':
          switch (call.functionParams[0].data) {
            case 0n:
              return [{ kind: ValueKind.Uint, data: 10n ** 18n }]
            case 1n:
              return [{ kind: ValueKind.Uint, data: 200n * 10n ** 18n }]
          }
          break
        case 'BatchExchange.latestSolution':
          return [
            { kind: ValueKind.Uint, data: 9n }, // batch ID
            { kind: ValueKind.Address, data: new Uint8Array(20) }, // submitter
            { kind: ValueKind.Uint, data: 1337n }, // burnt fees
            { kind: ValueKind.Uint, data: 42000n }, // objective value
          ]
      }

      throw new Error(`unpexcted contract call ${JSON.stringify(call)}`)
    })

    mappings.onTrade(
      {
        owner: user,
        orderId,
        sellToken: 0,
        buyToken: 1,
        executedSellAmount: 100000n * 10n ** 18n,
        executedBuyAmount: 500n * 10n ** 18n,
      },
      {
        block: { timestamp },
        logIndex,
        transaction: { hash: txHash },
      },
    )
  })

  it('creates a new trade entity', async () => {
    const trade = mappings.getEntity('Trade', tradeId)
    expect(trade).to.exist
    expect(trade).to.deep.equal({
      id: tradeId,
      order: orderUid,
      owner: user,
      sellVolume: 100000n * 10n ** 18n,
      buyVolume: 500n * 10n ** 18n,
      tradeBatchId: 9n,
      tradeEpoch: 11n * 300n,
      buyToken: '1',
      sellToken: '0',
      createEpoch: timestamp,
      revertEpoch: null,
      txHash,
      txLogIndex: logIndex,
    })
  })

  it('creates a new solution and adds trades to it', async () => {
    const solution = mappings.getEntity('Solution', tradeId)
    expect(solution).to.exist
    expect(solution).to.deep.equal({
      id: tradeId,
      batch: '9',
      solver: `0x${'00'.repeat(20)}`,
      feeReward: 1337n,
      objectiveValue: 42000n,
      trades: [tradeId],
      createEpoch: timestamp,
      revertEpoch: null,
      txHash,
      txLogIndex: logIndex,
    })
  })

  it('creates a new solution and adds trades to it', async () => {
    const order = mappings.getEntity('Order', orderUid)
    expect(order).to.exist
    expect(order!.soldVolume).to.equal(100000n * 10n ** 18n)
    expect(order!.boughtVolume).to.equal(500n * 10n ** 18n)
  })
})
