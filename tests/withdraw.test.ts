import { expect } from 'chai'
import { Mappings } from './wasm'

describe('onWithdrawRequest', function () {
  it('creates a new withdraw request entity', async () => {
    const user = `0x${'1337'.repeat(10)}`
    const token = `0x${'42'.repeat(20)}`
    const amount = 100n
    const batchId = 567n

    const timestamp = 10n * 300n + 42n
    const logIndex = 1n
    const txHash = `0x${'01'.repeat(32)}`
    const withdrawRequestId = `${txHash}-${logIndex}`

    const mappings = await Mappings.load()
    mappings.onWithdrawRequest(
      {
        user,
        token,
        amount,
        batchId,
      },
      {
        block: { timestamp },
        logIndex,
        transaction: { hash: txHash },
      },
    )

    const batch = mappings.getEntity('WithdrawRequest', withdrawRequestId)
    expect(batch).to.exist
    expect(batch).to.deep.equal({
      id: withdrawRequestId,
      user,
      tokenAddress: token,
      amount,
      withdrawableFromBatchId: batchId,
      createEpoch: timestamp,
      createBatchId: timestamp / 300n,
      txHash,
    })
  })
})

describe('onWithdraw', function () {
  it('creates a new withdraw entity', async () => {
    const user = `0x${'1337'.repeat(10)}`
    const token = `0x${'42'.repeat(20)}`
    const amount = 100n

    const timestamp = 10n * 300n + 42n
    const logIndex = 1n
    const txHash = `0x${'01'.repeat(32)}`
    const withdrawId = `${txHash}-${logIndex}`

    const mappings = await Mappings.load()
    mappings.onWithdraw(
      {
        user,
        token,
        amount,
      },
      {
        block: { timestamp },
        logIndex,
        transaction: { hash: txHash },
      },
    )

    const batch = mappings.getEntity('Withdraw', withdrawId)
    expect(batch).to.exist
    expect(batch).to.deep.equal({
      id: withdrawId,
      user,
      tokenAddress: token,
      amount,
      createEpoch: timestamp,
      createBatchId: timestamp / 300n,
      txHash,
    })
  })
})
