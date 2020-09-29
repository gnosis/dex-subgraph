import { log, BigInt } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { TokenListing as TokenListingEvent } from '../../generated/BatchExchange/BatchExchange'
import { Erc20 } from '../../generated/BatchExchange/Erc20'
import { epochToBatchId } from '../utils'

export function onTokenListing(event: TokenListingEvent): void {
  let params = event.params

  // Get token id
  let id = BigInt.fromI32(params.id).toString()
  let address = params.token
  log.info('[onTokenListing] Add token {} with address {}', [id, address.toHex()])

  // Create token
  let token = new Token(id)
  token.address = address
  token.fromBatchId = epochToBatchId(event.block.timestamp)

  // Add symbol (optional)
  let erc20 = Erc20.bind(address)
  let symbolAttempt = erc20.try_symbol()
  if (symbolAttempt.reverted) {
    log.warning('Adding a ERC20 token with no "symbol". Address: {}', [address.toHex()])
    token.symbol = null
  } else {
    token.symbol = symbolAttempt.value
  }

  // Add name (optional)
  let nameAttempt = erc20.try_name()
  if (nameAttempt.reverted) {
    log.warning('Adding a ERC20 token with no "name". Address: {}', [address.toHex()])
    token.name = null
  } else {
    token.name = nameAttempt.value
  }

  // Add decimals (optional)
  let decimalsAttempt = erc20.try_decimals()
  if (decimalsAttempt.reverted) {
    log.warning('Adding a ERC20 token with no "decimals". Address: {}', [address.toHex()])
    token.decimals = null
  } else {
    token.decimals = BigInt.fromI32(decimalsAttempt.value)
  }

  // Audit dates
  token.createEpoch = event.block.timestamp

  // Transaction
  token.txHash = event.transaction.hash

  token.save()
}

export function getTokenById(tokenId: i32): Token {
  let id = BigInt.fromI32(tokenId).toString()
  let tokenOpt = Token.load(id)
  if (!tokenOpt) {
    throw new Error("Token doesn't exist: " + id)
  }
  return tokenOpt!
}
