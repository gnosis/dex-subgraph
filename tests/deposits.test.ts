import { expect } from 'chai'
import { Mappings } from './wasm'

describe('onDeposit', function () {
  it('creates a deposit entity', async () => {
    const mappings = await Mappings.load()

    const txHash = `0x${'42'.repeat(32)}`
    mappings.onDeposit(
      {
        user: '0x0000000000000000000000000000000000000001',
        token: '0x0000000000000000000000000000000000000002',
        amount: 10n ** 18n,
        batchId: 42,
      },
      {
        logIndex: 42,
        block: {
          timestamp: 42 * 300,
        },
        transaction: {
          hash: txHash,
        },
      },
    )

    const depositId = `${txHash}-42`
    expect(mappings.getEntity('Deposit', depositId)).to.deep.equal({
      id: depositId,
      user: '0x0000000000000000000000000000000000000001',
      tokenAddress: '0x0000000000000000000000000000000000000002',
      amount: 10n ** 18n,
      batchId: 42n,
      createEpoch: 42n * 300n,
      txHash,
    })
  })

  it('creates a user if it does not exist', async () => {
    const mappings = await Mappings.load()

    const user = '0x0123456789012345678901234567890123456789'
    const txHash = `0x${'42'.repeat(32)}`
    const timestamp = 1337n
    mappings.onDeposit(
      {
        user,
        token: '0x0000000000000000000000000000000000000001',
        amount: 10n ** 18n,
        batchId: 42,
      },
      {
        block: { timestamp },
        transaction: {
          hash: txHash,
        },
      },
    )

    expect(mappings.getEntity('User', user)).to.deep.equal({
      id: user,
      txHash,
      createEpoch: timestamp,
      fromBatchId: timestamp / 300n,
    })
  })

  it('reuses existing user', async () => {
    const mappings = await Mappings.load()

    const userId = '0x0123456789012345678901234567890123456789'
    const userTx = `0x${'01'.repeat(32)}`

    // NOTE: Manually add an existing user entry that should be reused.
    mappings.setEntity('User', userId, {
      id: userId,
      txHash: userTx,
      createEpoch: 1337n,
      fromBatchId: 4n,
    })

    mappings.onDeposit(
      {
        user: userId,
        token: '0x0000000000000000000000000000000000000001',
        amount: 10n ** 18n,
        batchId: 42,
      },
      {
        // NOTE: Different Tx hash and batch than the manually created user.
        transaction: {
          hash: `0x${'02'.repeat(32)}`,
        },
      },
    )

    const user = mappings.getEntity('User', userId)
    expect(user).to.not.be.null
    expect(user!.txHash).to.equal(userTx)
  })
})
