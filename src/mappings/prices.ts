import { log, BigInt } from '@graphprotocol/graph-ts'
import { Order, Price, Trade } from '../../generated/schema'
import { EthereumEvent } from '@graphprotocol/graph-ts'
import { toPriceId } from '../utils'
import { BatchExchange } from '../../generated/BatchExchange/BatchExchange'

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

  // Price and volume
  let batchExchange = BatchExchange.bind(event.address)
  price.priceInOwl = batchExchange.currentPrices(tokenId)
  price.volume = BigInt.fromI32(0)

  // Audit dates
  price.createEpoch = event.block.timestamp

  // Transaction
  price.txHash = event.transaction.hash

  price.save()
  return price
}

export function getPriceById(priceId: string): Order {
  let priceOpt = Order.load(priceId)
  if (!priceOpt) {
    throw new Error("Price doesn't exist: " + priceId)
  }
  return priceOpt
}
