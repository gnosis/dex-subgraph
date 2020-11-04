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
