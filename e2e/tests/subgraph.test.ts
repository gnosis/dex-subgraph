import { expect } from 'chai'
import { query } from './graphql'

describe('Subgraph', function () {
  it('should list tokens', async () => {
    const tokens = await query(`{
      tokens {
        id
      }
    }`)
    expect(tokens).to.deep.equal({
      tokens: [{ id: '0' }, { id: '1' }],
    })
  })
})
