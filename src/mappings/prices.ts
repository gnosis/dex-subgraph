import { log, BigInt } from '@graphprotocol/graph-ts'
import { Price, Trade } from '../../generated/schema'
import { EthereumEvent } from '@graphprotocol/graph-ts'
import { toPriceId, getOwlDecimals, calculatePrice, toWei, exponential, coalesce } from '../utils'
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
        "OWL weis" / "1e18 Token weis"
    ... or in other words:
        "OWL weis" / "exa Token weis"

  Yes it's confusing, but keep reading to understand what it means, and the reason why.
         
  Our objective is to calculate the price in a user friendly format.
  The format we want is "number of OWLs per unit of Token": OWL / Token
  
  So, in this price format we want to return, for example in WETH-OWL market, 150 would mean:
    - The units in scientific notation are OWL/WETH
    - It would mean 150 OWLs is the price of 1 WETH
    - Informally, people would say, the price of the token is "150 OWL"
    - WETH is the base token
    - OWL is the quote token

  i.e. For USDC wich has 6 decimals if the contract returns 980942729992317873036301363769:
    - It would mean 980942729992317873036301363769 "weis of owl for each 1e18 weis of USDC"
    - In other words 980942729992317873036301363769 "OWL weis / exa USDC weis"  
    - Indeed, it's confusing, however it's the way the contract stores the price, for 2 reasons:
        - 1) To avoid dealing with decimals simplify it's logic (this is why prices and amounts are always in wei)
        - 2) The 1e18 (or exa) is just to be able to give a more accurate price, so instead of saving the 
             price for 1 wei (that could be potentially to small), it saves the price of a lot of weis (1e18 --> exa)
        - To understand better why exa is used, let's see two examples:
            * What is the price of an egg? Probably no-one would ask that, and he would ask for the price of a dozen
            * A bit more extreme. What's the mass of an atom? Instead of calculating the mass of a single atom, we 
              express the values for a huge number of them; 1.66 * 1e27 (Avogadro number) 
              https://en.wikipedia.org/wiki/Atomic_mass
    - Now that we understand the reasoning. Let's explain how we go from that number to units.
      For that we will explain it using scientific notation, and going backwards:

          980942729992317873036301363769 * <something> = 0.98094273 OWL/USDC
            --> <something> = 1e-30
      Okay, so:
        [price * 1e-30 ] OWL / USDC
        [price * 1e-18 * 1e-18 * 1e6 ] OWL / USDC
        [price * 1e-18 * 1e-18  ] OWL / USDC * 1e-6
        [price * 1e-18 * 1e-18] OWL / USDC wei
        [price * 1e-18] OWL / 1e18 * USDC wei
        [price * 1e-18] OWL / exa USDC wei
        [price] OWL * 1e-18 / exa USDC wei
        [price] OWL wei / exa USDC wei

 */
function _getPriceInOwl(tokenId: i32, event: EthereumEvent): BigInt[] {
  // Price: Calculate price in user friendly format

  let batchExchange = BatchExchange.bind(event.address)
  let token = getTokenById(tokenId)

  // Excuse the name of the var name, but it tries to represent what the contract returns (read above comments)
  let weisOfOwlPerExaWeiOfToken = batchExchange.currentPrices(tokenId)
  let hexaWeiOfToken = toWei(EXA_AMOUNT, token.decimals)

  // Since the "price value" is in "OWL wei / exa USDC wei"
  //    - base token: exa Token weis
  //    - quote token: the "price value"
  return calculatePrice(hexaWeiOfToken, token.decimals, weisOfOwlPerExaWeiOfToken, getOwlDecimals())
}
