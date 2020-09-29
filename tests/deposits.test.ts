import { expect } from 'chai'
import { Mappings } from './wasm'

describe('onDeposit', function () {
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
        transactionHash: txHash,
        blockTimestamp: timestamp,
      },
    )

    expect(mappings.getEntity('User', user)).to.deep.equal({
      id: user,
      txHash,
      createEpoch: timestamp,
      fromBatchId: timestamp / 300n,
    })
  })
})
