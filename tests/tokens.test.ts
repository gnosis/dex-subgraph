import { expect } from 'chai'
import { Mappings } from './runtime'

describe('onAddToken', function () {
  it('adds a new token', async () => {
    await Mappings.load().catch((err) => expect(err.message).to.equal('not implemented'))
  })
})
