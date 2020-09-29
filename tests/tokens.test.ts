import { expect } from 'chai'
import { Mappings } from './runtime'

describe('onAddToken', function () {
  it('adds a new token', async () => {
    const mappings = await Mappings.load()
    expect(() => mappings.onAddToken()).to.throw()
  })
})
