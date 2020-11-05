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

  it('should contain the final solution with trades', async () => {
    const { batches } = (await query(`{
      batches {
        solution {
          revertEpoch,
          trades {
            id
          }
        }
      }
    }`)) as {
      batches: {
        solution: {
          revertEpoch: string | null
          trades: { id: string }[]
        }
      }[]
    }

    expect(batches.length).to.equal(1)
    expect(batches[0].solution.trades.length).to.equal(2)
    expect(batches[0].solution.revertEpoch).to.be.null
  })

  it('should contain the reverted solution with reverted trades', async () => {
    const { batches } = (await query(`{
      batches {
        solutions(where: {revertEpoch_not: null}) {
          revertEpoch
          trades {
            revertEpoch
          }
        }
      }
    }`)) as {
      batches: {
        solutions: {
          revertEpoch: string | null
          trades: { revertEpoch: string | null }[]
        }[]
      }[]
    }

    expect(batches.length).to.equal(1)
    const batch = batches[0]

    expect(batch.solutions.length).to.equal(1)
    const solution = batch.solutions[0]
    expect(solution.revertEpoch).to.not.be.null

    expect(solution.trades.length).to.equal(2)
    expect(solution.trades[0].revertEpoch).to.equal(solution.revertEpoch)
    expect(solution.trades[1].revertEpoch).to.equal(solution.revertEpoch)
  })

  it('should contain the final price', async () => {
    const { batches, prices } = (await query(`{
      prices {
        createEpoch
      },
      batches {
        solution {
          createEpoch
        }
      }
    }`)) as {
      batches: {
        solution: {
          createEpoch: string
        }
      }[]
      prices: {
        createEpoch: string
      }[]
    }

    expect(batches.length).to.equal(1)
    expect(prices.length).to.equal(2)

    expect(prices[0].createEpoch).to.equal(batches[0].solution.createEpoch)
    expect(prices[1].createEpoch).to.equal(batches[0].solution.createEpoch)
  })

  it('should update bought & sold volume on order', async () => {
    const { orders } = (await query(`{
      orders {
        soldVolume
        boughtVolume
        trades {
          sellVolume
          buyVolume
          revertEpoch
        }
      }
    }`)) as {
      orders: {
        soldVolume: string
        boughtVolume: string
        trades: {
          sellVolume: string
          buyVolume: string
          revertEpoch: string | null
        }[]
      }[]
    }

    for (const order of orders) {
      for (const trade of order.trades) {
        if (trade.revertEpoch === null) {
          // Final trades should match volume
          expect(trade.sellVolume).to.equal(order.soldVolume)
          expect(trade.buyVolume).to.equal(order.boughtVolume)
        } else {
          // Reverted trades should not match volume
          expect(trade.sellVolume).to.not.equal(order.soldVolume)
          expect(trade.buyVolume).to.not.equal(order.boughtVolume)
        }
      }
    }
  })

  it('should contain tokens with cumulative sell volume', async () => {
    const { orders } = (await query(`{
      orders(where: {soldVolume_gt: 0}) {
        soldVolume
        sellToken {
          sellVolume
        }
      }
    }`)) as {
      orders: {
        soldVolume: string
        sellToken: {
          sellVolume: string
        }
      }[]
    }

    for (const order of orders) {
      expect(order.soldVolume).to.equal(order.sellToken.sellVolume)
    }
  })

  it('should contain latest stats', async () => {
    const { stats } = (await query(`{
      stats(id: "latest") {
        utilityInOwl
        volumeInOwl
        owlBurnt
        settledBatchCount
        settledTradeCount
        listedTokens
      }
    }`)) as {
      stats: {
        volumeInOwl: string
        utilityInOwl: string
        owlBurnt: string
        settledBatchCount: string
        settledTradeCount: string
        listedTokens: string
      }
    }

    expect(stats.volumeInOwl).to.equal('40020020020020020000')
    expect(stats.utilityInOwl).to.equal('1997000999999950199701198')
    expect(stats.owlBurnt).to.equal('20010010010010010')
    expect(stats.settledBatchCount).to.equal(1)
    expect(stats.settledTradeCount).to.equal(2)
    expect(stats.listedTokens).to.equal(2)
  })
})
