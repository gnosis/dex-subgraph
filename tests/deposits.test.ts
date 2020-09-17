import { expect } from 'chai'
import { Mappings } from './runtime'

describe('onDeposit', function () {
  it('creates a user if it does not exist', async () => {
    const mappings = await Mappings.load()

    const user = '0x0123456789012345678901234567890123456789'
    const tx = `0x${'42'.repeat(32)}`

    expect(() => {
      mappings.onDeposit(
        {
          user,
          token: '0x0000000000000000000000000000000000000001',
          amount: 10n ** 18n,
          batchId: 42,
        },
        {
          transactionHash: tx,
        },
      )
    }).to.throw('not implemented')
  })
})
