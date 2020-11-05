import { log, BigInt } from '@graphprotocol/graph-ts'
import { Stats } from '../../generated/schema'

export function addTokenToStats(): void {
  let stats = getOrCreateStats()
  stats.listedTokens += 1
  stats.save()
}

export function addSolutionToStats(utility: BigInt, owlBurnt: BigInt, tradeCount: u32): void {
  let stats = getOrCreateStats()
  // We burn half of the 0.1% trading fee, therefore volume is 2000 * owl burn
  stats.volumeInOwl += BigInt.fromI32(2000).times(owlBurnt)
  stats.utilityInOwl += utility
  stats.owlBurnt += owlBurnt
  stats.settledBatchCount += 1
  stats.settledTradeCount += tradeCount
  stats.save()
}

export function revertSolutionFromStats(utility: BigInt, owlBurnt: BigInt, tradeCount: u32): void {
  let stats = getOrCreateStats()
  // We burn half of the 0.1% trading fee, therefore volume is 2000 * owl burn
  stats.volumeInOwl -= BigInt.fromI32(2000).times(owlBurnt)
  stats.utilityInOwl -= utility
  stats.owlBurnt -= owlBurnt
  stats.settledBatchCount -= 1
  stats.settledTradeCount -= tradeCount
  stats.save()
}

function getOrCreateStats(): Stats {
  let stats = Stats.load('latest')
  if (!stats) {
    log.info('[Stats] Creating new stats', [])
    stats = new Stats('latest')
    stats.volumeInOwl = BigInt.fromI32(0)
    stats.utilityInOwl = BigInt.fromI32(0)
    stats.owlBurnt = BigInt.fromI32(0)
    stats.settledBatchCount = 0
    stats.settledTradeCount = 0
    stats.listedTokens = 0
  }
  return stats!
}
