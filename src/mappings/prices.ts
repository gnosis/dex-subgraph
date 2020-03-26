import { log, BigInt } from '@graphprotocol/graph-ts'
import { Price, Trade } from '../../generated/schema'
import { EthereumEvent } from '@graphprotocol/graph-ts'
import { toPriceId, getOwlDecimals, calculatePrice, toWei } from '../utils'
import { BatchExchange } from '../../generated/BatchExchange/BatchExchange'
import { getTokenById } from './tokens'

let EXA_AMOUNT = toWei(BigInt.fromI32(1), BigInt.fromI32(18))

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

  // Add token
  price.token = BigInt.fromI32(tokenId).toString()

  let priceInOwl = _getPriceInOwl(tokenId, event)
  price.priceInOwlNumerator = priceInOwl[0]
  price.priceInOwlDenominator = priceInOwl[1]

  // Volume
  price.volume = BigInt.fromI32(0)

  // Audit dates
  price.createEpoch = event.block.timestamp

  // Transaction
  price.txHash = event.transaction.hash

  price.save()
  return price
}

/**
  The price in the contract is recorded in an internal format that would be something like:
         "sell token in weis" / 1e18 OWLs
         
  We need to calculate the price in a user friendly format, a fraction with units:
         "sell token" / OWL

  i.e. For USDC wich has 6 decimals can return 980942729992317873036301363769, meaning:
      The units of this big number (980942729992317873036301363769) is:
          "OWL wei / exa USDC wei"
        or in other words:
          "weis of OWL by each 1e18 weis of USDC"
        
        Yes! it's confusing, but let's just explain it backwards:

        980942729992317873036301363769 * <something> = 0.98094273 USDC/OWL
            --> <something> = 1e-30 = 1e-18 * 1e-18 * 1e6
            
          [price * 1e-18 * 1e-18 * 1e6 ] USDC / OWL
          [price * 1e-18 * 1e-18 ] USDC * 1e6 / OWL
          [price * 1e-18 * 1e-18 ] USDC wei / OWL
          [price * 1e-18  ] USDC wei / OWL * 1e18
          [price * 1e-18 ] USDC wei / OWL wei
          [price] exa USDC wei / OWL wei
 */
function _getPriceInOwl(tokenId: i32, event: EthereumEvent): BigInt[] {
  // Price: Calculate price in user friendly format

  let batchExchange = BatchExchange.bind(event.address)
  let token = getTokenById(tokenId)

  // Excuse the name of the var name, but it tries to represent what the contract returns
  let weisOfTokenPerExaWeiOfOwl = batchExchange.currentPrices(tokenId)

  return calculatePrice(EXA_AMOUNT, getOwlDecimals(), weisOfTokenPerExaWeiOfOwl, token.decimals)
}
