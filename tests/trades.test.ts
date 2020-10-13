import { expect } from 'chai'
import { Mappings } from './wasm'

describe('onTradeReversion', function () {
  it('updates order total amounts and trade reversion epoch', async () => {
    const mappings = await Mappings.load()

    const user = `0x${'1337'.repeat(10)}`
    const orderId = 1337n
    const orderUid = `${user}-${orderId}`
    const tradeId = `0x${'01'.repeat(32)}-1`
    mappings.setEntity('Order', `${user}-${orderId}`, {
      id: orderUid,
      owner: user,
      orderId,
      fromBatchId: 0n,
      fromEpoch: 0n,
      untilBatchId: 42n,
      untilEpoch: 42n * 300n,
      buyToken: '0',
      sellToken: '1',
      priceNumerator: 200000n * 10n ** 18n,
      priceDenominator: 1000n * 10n ** 18n,
      maxSellAmount: 200000n * 10n ** 18n,
      minReceiveAmount: 1000n * 10n ** 18n,
      soldVolume: 100000n * 10n ** 18n,
      boughtVolume: 500n * 10n ** 18n,
      trades: [tradeId],
      createEpoch: 0n,
      cancelEpoch: null,
      deleteEpoch: null,
      txHash: `0x${'00'.repeat(32)}`,
      txLogIndex: 0n,
    })
    mappings.setEntity('Trade', tradeId, {
      id: tradeId,
      order: orderUid,
      owner: user,
      sellVolume: 100000n * 10n ** 18n,
      buyVolume: 500n * 10n ** 18n,
      tradeBatchId: 9n,
      tradeEpoch: 10n * 300n,
      buyToken: '0',
      sellToken: '1',
      createEpoch: 10n * 300n,
      revertEpoch: null,
      txHash: `0x${'01'.repeat(32)}`,
      txLogIndex: 1n,
    })

    const timestamp = 10n * 300n + 42n
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
        block: { timestamp },
      },
    )

    const order = mappings.getEntity('Order', orderUid)
    expect(order).to.exist
    expect(order!.soldVolume).to.equal(0n)
    expect(order!.boughtVolume).to.equal(0n)

    const trade = mappings.getEntity('Trade', tradeId)
    expect(trade).to.exist
    expect(trade!.revertEpoch).to.equal(timestamp)
  })

  it('reverts correct trade when solution gets reverted twice', async () => {
    const mappings = await Mappings.load()

    const user = `0x${'1337'.repeat(10)}`
    const orderId = 1337n
    const orderUid = `${user}-${orderId}`
    const trade0Id = `0x${'01'.repeat(32)}-1`
    const trade1Id = `0x${'02'.repeat(32)}-2`
    mappings.setEntity('Order', `${user}-${orderId}`, {
      id: orderUid,
      owner: user,
      orderId,
      fromBatchId: 0n,
      fromEpoch: 0n,
      untilBatchId: 42n,
      untilEpoch: 42n * 300n,
      buyToken: '0',
      sellToken: '1',
      priceNumerator: 200000n * 10n ** 18n,
      priceDenominator: 1000n * 10n ** 18n,
      maxSellAmount: 200000n * 10n ** 18n,
      minReceiveAmount: 1000n * 10n ** 18n,
      soldVolume: 100000n * 10n ** 18n,
      boughtVolume: 500n * 10n ** 18n,
      trades: [trade0Id, trade1Id],
      createEpoch: 0n,
      cancelEpoch: null,
      deleteEpoch: null,
      txHash: `0x${'00'.repeat(32)}`,
      txLogIndex: 0n,
    })
    mappings.setEntity('Trade', trade0Id, {
      id: trade0Id,
      order: orderUid,
      owner: user,
      sellVolume: 140000n * 10n ** 18n,
      buyVolume: 700n * 10n ** 18n,
      tradeBatchId: 9n,
      tradeEpoch: 10n * 300n,
      buyToken: '0',
      sellToken: '1',
      createEpoch: 10n * 300n,
      revertEpoch: 10n * 300n + 1n, // previously reverted trade
      txHash: `0x${'01'.repeat(32)}`,
      txLogIndex: 1n,
    })
    mappings.setEntity('Trade', trade1Id, {
      id: trade1Id,
      order: orderUid,
      owner: user,
      sellVolume: 100000n * 10n ** 18n,
      buyVolume: 500n * 10n ** 18n,
      tradeBatchId: 9n,
      tradeEpoch: 10n * 300n,
      buyToken: '0',
      sellToken: '1',
      createEpoch: 10n * 300n + 2n,
      revertEpoch: null,
      txHash: `0x${'02'.repeat(32)}`,
      txLogIndex: 2n,
    })

    const timestamp = 10n * 300n + 3n
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
        block: { timestamp },
      },
    )

    const order = mappings.getEntity('Order', orderUid)
    expect(order).to.exist
    expect(order!.soldVolume).to.equal(0n)
    expect(order!.boughtVolume).to.equal(0n)

    const trade = mappings.getEntity('Trade', trade1Id)
    expect(trade).to.exist
    expect(trade!.revertEpoch).to.equal(timestamp)
  })

  it('errors if order does not exit', async () => {
    const mappings = await Mappings.load()
    expect(() =>
      mappings.onTradeReversion({
        owner: `0x${'00'.repeat(20)}`,
        orderId: 0,
        sellToken: 0,
        buyToken: 1,
        executedSellAmount: 100000n * 10n ** 18n,
        executedBuyAmount: 500n * 10n ** 18n,
      }),
    ).to.throw('aborted')
  })

  it('errors if there are no active trades for an order', async () => {
    const mappings = await Mappings.load()

    const user = `0x${'01'.repeat(20)}`
    const orderId = 1337n
    const orderUid = `${user}-${orderId}`
    mappings.setEntity('Order', orderUid, {
      id: orderUid,
      owner: user,
      orderId,
      fromBatchId: 0n,
      fromEpoch: 0n,
      untilBatchId: 42n,
      untilEpoch: 42n * 300n,
      buyToken: '0',
      sellToken: '1',
      priceNumerator: 200000n * 10n ** 18n,
      priceDenominator: 1000n * 10n ** 18n,
      maxSellAmount: 200000n * 10n ** 18n,
      minReceiveAmount: 1000n * 10n ** 18n,
      soldVolume: 100000n * 10n ** 18n,
      boughtVolume: 500n * 10n ** 18n,
      trades: [],
      createEpoch: 0n,
      cancelEpoch: null,
      deleteEpoch: null,
      txHash: `0x${'00'.repeat(32)}`,
      txLogIndex: 0n,
    })

    expect(() =>
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
          block: { timestamp: 10n * 300n },
        },
      ),
    ).to.throw('aborted')
  })

  it('errors if there is more than one active trade for an order', async () => {
    const mappings = await Mappings.load()

    const user = `0x${'01'.repeat(20)}`
    const orderId = 1337n
    const orderUid = `${user}-${orderId}`
    const solutionTx = `0x${'10'.repeat(32)}`
    mappings.setEntity('Order', orderUid, {
      id: orderUid,
      owner: user,
      orderId,
      fromBatchId: 0n,
      fromEpoch: 0n,
      untilBatchId: 42n,
      untilEpoch: 42n * 300n,
      buyToken: '0',
      sellToken: '1',
      priceNumerator: 200000n * 10n ** 18n,
      priceDenominator: 1000n * 10n ** 18n,
      maxSellAmount: 200000n * 10n ** 18n,
      minReceiveAmount: 1000n * 10n ** 18n,
      soldVolume: 100000n * 10n ** 18n,
      boughtVolume: 500n * 10n ** 18n,
      trades: [],
      createEpoch: 0n,
      cancelEpoch: null,
      deleteEpoch: null,
      txHash: `0x${'00'.repeat(32)}`,
      txLogIndex: 0n,
    })
    mappings.setEntity('Trade', `${user}-1`, {
      id: `${user}-1`,
      order: orderUid,
      owner: user,
      sellVolume: 100000n * 10n ** 18n,
      buyVolume: 500n * 10n ** 18n,
      tradeBatchId: 9n,
      tradeEpoch: 10n * 300n,
      buyToken: '0',
      sellToken: '1',
      createEpoch: 10n * 300n,
      revertEpoch: null,
      txHash: solutionTx,
      txLogIndex: 1n,
    })
    mappings.setEntity('Trade', `${user}-2`, {
      id: `${user}-2`,
      order: orderUid,
      owner: user,
      sellVolume: 100000n * 10n ** 18n,
      buyVolume: 500n * 10n ** 18n,
      tradeBatchId: 9n,
      tradeEpoch: 10n * 300n,
      buyToken: '0',
      sellToken: '1',
      createEpoch: 10n * 300n,
      revertEpoch: null,
      txHash: solutionTx,
      txLogIndex: 2n,
    })

    expect(() =>
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
          block: { timestamp: 10n * 300n },
        },
      ),
    ).to.throw('aborted')
  })
})
