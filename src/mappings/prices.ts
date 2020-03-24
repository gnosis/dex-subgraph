import { log, BigInt } from '@graphprotocol/graph-ts'
import { Price, Trade } from '../../generated/schema'
import { EthereumEvent } from '@graphprotocol/graph-ts'
import { toPriceId, getOwlDecimals, toPriceInUnits } from '../utils'
import { BatchExchange } from '../../generated/BatchExchange/BatchExchange'
import { getTokenById } from './tokens'

export function createOrUpdatePrice(tokenId: i32, trade: Trade, event: EthereumEvent): void {
  log.info('[createOrUpdatePrice] Create or Update Price for batch {} and Token {}. Tx: ', [
    trade.tradeBatchId.toString(),
    BigInt.fromI32(tokenId).toString(),
    event.transaction.hash.toHex(),
  ])

  let priceId = toPriceId(tokenId, trade.tradeBatchId)
  let price = Price.load(priceId)

  log.info('[createOrUpdatePrice] Make sure price {} exists', [priceId])
  if (price == null) {
    // Create price for the current batch
    price = _createPrice(priceId, tokenId, trade, event)
  }
  // TODO: Else handling reverts of solutions

  price.volume = price.volume.plus(trade.sellVolume)
  price.save()
}

export function _createPrice(priceId: string, tokenId: i32, trade: Trade, event: EthereumEvent): Price {
  log.info('[createPrice] Create Price {}', [priceId])

  // Create token
  let price = new Price(priceId)
  price.batchId = trade.tradeBatchId

  // Addd token
  price.token = BigInt.fromI32(tokenId).toString()

  // Price: The price is given in weis of the token per owl, so it needs to be translated into tokens per owl
  let batchExchange = BatchExchange.bind(event.address)
  let token = getTokenById(tokenId)
  let priceInWeis = batchExchange.currentPrices(tokenId)
  price.priceInOwl = toPriceInUnits(priceInWeis, token.decimals, getOwlDecimals())

  // Volume
  price.volume = BigInt.fromI32(0)

  // Audit dates
  price.createEpoch = event.block.timestamp

  // Transaction
  price.txHash = event.transaction.hash

  price.save()
  return price
}
