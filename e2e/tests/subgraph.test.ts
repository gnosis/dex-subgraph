import { expect } from 'chai'
import { query } from './graphql'

describe('Subgraph', function () {
  it('should list tokens', async () => {
    const data = await query(`{
      tokens {
        id
      }
    }`)
    expect(data).to.deep.equal({
      tokens: [{ id: '0' }, { id: '1' }],
    })
  })

  it('should contain a solution with trades', async () => {
    const { batches } = (await query(`{
      batches {
        solution {
          trades {
            id
          }
        }
      }
    }`)) as {
      batches: {
        solution: {
          trades: { id: string }[]
        }
      }[]
    }

    expect(batches.length).to.equal(1)
    expect(batches[0].solution.trades.length).to.equal(2)
  })
})
