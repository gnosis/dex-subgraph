import { expect } from 'chai'
import { Mappings } from './wasm'
import { ValueKind } from './wasm/runtime/ethereum'

describe('onTokenListing', function () {
  it('creates a token', async () => {
    const mappings = await Mappings.load()
    mappings.setCallHandler((call) => {
      const callName = `${call.contractName}.${call.functionName}`
      switch (callName) {
        case `Erc20.symbol`:
          return [{ kind: ValueKind.String, data: 'TEST' }]
        case `Erc20.name`:
          return [{ kind: ValueKind.String, data: 'Test Token' }]
        case `Erc20.decimals`:
          return [{ kind: ValueKind.Uint, data: 18n }]
        default:
          throw new Error(`unexpected contract call ${callName}`)
      }
    })

    mappings.onTokenListing(
      {
        id: 42,
        token: '0x1337133713371337133713371337133713371337',
      },
      {
        block: {
          timestamp: 42 * 300,
        },
        transaction: {
          hash: `0x${'42'.repeat(32)}`,
        },
      },
    )

    expect(mappings.getEntity('Token', '42')).to.deep.equal({
      id: '42',
      address: '0x1337133713371337133713371337133713371337',
      fromBatchId: 42n,
      symbol: 'TEST',
      decimals: 18n,
      name: 'Test Token',
      createEpoch: 42n * 300n,
      txHash: `0x${'42'.repeat(32)}`,
    })
  })

  it('accepts tokens without details', async () => {
    const mappings = await Mappings.load()
    mappings.setCallHandler(() => null)

    mappings.onTokenListing({
      id: 0,
      token: `0x${'00'.repeat(20)}`,
    })

    const { symbol, name, decimals } = mappings.getEntity('Token', '0')!
    expect({ symbol, name, decimals }).to.deep.equal({
      symbol: null,
      name: null,
      decimals: null,
    })
  })
})
