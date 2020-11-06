import { expect } from 'chai'
import { Mappings } from './wasm'

describe('onOrderPlacement', function () {
  let mappings: Mappings

  const user = `0x${'1337'.repeat(10)}`
  const index = 42
  const orderUid = `${user}-${index}`
  const maxSellAmount = 200000n * 10n ** 18n
  const minReceiveAmount = 1000n * 10n ** 18n
  const buyToken = 1n
  const sellToken = 2n
  const validFrom = 13n
  const validUntil = 17n

  const txHash = `0x${'01'.repeat(32)}`
  const logIndex = 1n
  const timestamp = 10n * 300n + 42n

  beforeEach(async function () {
    mappings = await Mappings.load()
    mappings.setEntity('Token', `${sellToken}`, {
      id: `${sellToken}`,
      address: `0x${'00'.repeat(20)}`,
      fromBatchId: 0n,
      symbol: 'OWL',
      decimals: 18n,
      name: 'Token OWL',
      createEpoch: 0n,
      txHash: `0x${'00'.repeat(32)}`,
    })
    mappings.setEntity('Token', `${buyToken}`, {
      id: `${buyToken}`,
      address: `0x${'00'.repeat(20)}`,
      fromBatchId: 0n,
      symbol: 'GNO',
      decimals: 18n,
      name: 'GNO Token',
      createEpoch: 0n,
      txHash: `0x${'01'.repeat(32)}`,
    })

    mappings.onOrderPlacement(
      {
        owner: user,
        index,
        validFrom,
        validUntil,
        buyToken,
        sellToken,
        priceNumerator: minReceiveAmount,
        priceDenominator: maxSellAmount,
      },
      {
        block: { timestamp },
        logIndex,
        transaction: { hash: txHash },
      },
    )
  })

  it('create an order entity', async function () {
    const order = mappings.getEntity('Order', orderUid)
    expect(order).to.exist
    expect(order).to.deep.equal({
      id: orderUid,
      owner: user,
      orderId: index,
      fromBatchId: validFrom,
      fromEpoch: validFrom * 300n,
      untilBatchId: validUntil,
      untilEpoch: validUntil * 300n,
      buyToken: `${buyToken}`,
      sellToken: `${sellToken}`,
      priceNumerator: minReceiveAmount,
      priceDenominator: maxSellAmount,
      maxSellAmount,
      minReceiveAmount,
      soldVolume: 0n,
      boughtVolume: 0n,
      createEpoch: timestamp,
      cancelEpoch: null,
      deleteEpoch: null,
      txHash,
      txLogIndex: logIndex,
    })
  })

  it('create a user entity', async function () {
    const batch = mappings.getEntity('User', user)
    expect(batch).to.exist
    expect(batch).to.deep.equal({
      id: user,
      fromBatchId: timestamp / 300n,
      createEpoch: timestamp,
      txHash,
    })
  })
})

describe('onOrderCancellation', function () {
  let mappings: Mappings

  const user = `0x${'1337'.repeat(10)}`
  const index = 42
  const orderUid = `${user}-${index}`

  const txHash = `0x${'02'.repeat(32)}`
  const logIndex = 1n
  const timestamp = 10n * 300n + 42n

  beforeEach(async function () {
    mappings = await Mappings.load()
    mappings.setEntity('Order', orderUid, orderFixture(user, index))
    mappings.onOrderCancellation(
      {
        owner: user,
        index,
      },
      {
        block: { timestamp },
        logIndex,
        transaction: { hash: txHash },
      },
    )
  })

  it('sets the cancellation epoch', async function () {
    const order = mappings.getEntity('Order', orderUid)
    expect(order!.cancelEpoch).to.equal(timestamp)
  })

  it('updates the valid until batchId', async function () {
    const order = mappings.getEntity('Order', orderUid)
    const validUntil = timestamp / 300n - 1n

    expect(order!.untilBatchId).to.equal(validUntil)
    expect(order!.untilEpoch).to.equal(validUntil * 300n)
  })
})

describe('orderDeletion', function () {
  let mappings: Mappings

  const user = `0x${'1337'.repeat(10)}`
  const index = 42
  const orderUid = `${user}-${index}`

  const txHash = `0x${'02'.repeat(32)}`
  const logIndex = 1n
  const timestamp = 10n * 300n + 42n

  beforeEach(async function () {
    mappings = await Mappings.load()
    mappings.setEntity('Order', orderUid, orderFixture(user, index))
    mappings.onOrderDeletion(
      {
        owner: user,
        index,
      },
      {
        block: { timestamp },
        logIndex,
        transaction: { hash: txHash },
      },
    )
  })

  it('sets the deletion epoch', async function () {
    const order = mappings.getEntity('Order', orderUid)
    expect(order!.deleteEpoch).to.equal(timestamp)
  })

  it('updates the valid until batchId', async function () {
    const order = mappings.getEntity('Order', orderUid)
    const validUntil = timestamp / 300n - 1n

    expect(order!.untilBatchId).to.equal(validUntil)
    expect(order!.untilEpoch).to.equal(validUntil * 300n)
  })
})

function orderFixture(user: string, orderId: number) {
  return {
    id: `${user}-${orderId}`,
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
    txHash: `0x${'0f'.repeat(32)}`,
    txLogIndex: 0n,
  }
}
