import { log, Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { AddTokenCall, BatchExchange } from '../../generated/BatchExchange/BatchExchange'
import { Erc20 } from '../../generated/BatchExchange/Erc20'
import { DEPRECATED_TOKENS, TokenDetails } from '../../config'
import { epochToBatchId } from '../utils'

export function onAddToken(call: AddTokenCall): void {
  let address = call.inputs.token
  let timestamp = call.block.timestamp
  let txHash = call.transaction.hash

  // Get token id
  let batchExchange = BatchExchange.bind(call.to)
  let tokenId = batchExchange.tokenAddressToIdMap(address)
  log.info('[onAddToken] Add token {} with address', [BigInt.fromI32(tokenId).toString(), address.toHex()])

  // Create token
  let id = BigInt.fromI32(tokenId).toString()
  _createToken(id, address, timestamp, txHash)

  // It's possible, that there was already some deposits
  // TODO: Update balances (once balances are implemented)
}

export function createTokenIfNotCreated(tokenId: u32, event: ethereum.Event): Token {
  let id = BigInt.fromI32(tokenId).toString()
  let token = Token.load(id)
  log.info('[createTokenIfNotCreated] Make sure token {} is created', [id])

  if (token == null) {
    let batchExchange = BatchExchange.bind(event.address)
    let address = batchExchange.tokenIdToAddressMap(tokenId)

    let timestamp = event.block.timestamp
    let txHash = event.transaction.hash

    // Create token if not created
    token = _createToken(id, address, timestamp, txHash)
  }

  return token!
}

export function getTokenById(tokenId: i32): Token {
  let id = BigInt.fromI32(tokenId).toString()
  let tokenOpt = Token.load(id)
  if (!tokenOpt) {
    throw new Error("Order doesn't exist: " + id)
  }
  return tokenOpt!
}

export function _createToken(id: string, address: Address, timestamp: BigInt, txHash: Bytes): Token {
  let addressString = address.toHex()
  log.info('[createToken] Create Token {} with address {}', [id, addressString])

  // Create token
  let token = new Token(id)
  token.address = address
  token.fromBatchId = epochToBatchId(timestamp)

  var deprecatedToken: TokenDetails | null = DEPRECATED_TOKENS.has(addressString)
    ? DEPRECATED_TOKENS.get(addressString)
    : null

  // Load the name and symbols
  let erc20 = Erc20.bind(address)
  if (deprecatedToken) {
    // Deprecated token, use the config names instead of the info from the contract
    log.info('[createToken] Deprecated token {} ({}): {}', [
      deprecatedToken.symbol,
      deprecatedToken.name,
      addressString,
    ])
    token.name = deprecatedToken.name
    token.symbol = deprecatedToken.symbol
  } else {
    // Load name and symbol from ERC20 contract
    log.info('[createToken] Get ERC20 token Info for token: {}', [addressString])

    // Add symbol (optional)
    let symbolAttempt = erc20.try_symbol()
    if (symbolAttempt.reverted) {
      log.warning('Adding a ERC20 token with no "symbol". Address: {}', [addressString])
      token.symbol = null
    } else {
      token.symbol = symbolAttempt.value
    }

    // Add name (optional)
    let nameAttempt = erc20.try_name()
    if (nameAttempt.reverted) {
      log.warning('Adding a ERC20 token with no "name". Address: {}', [addressString])
      token.name = null
    } else {
      token.name = nameAttempt.value
    }
  }

  // Add decimals (optional)
  let decimalsAttempt = erc20.try_decimals()
  if (decimalsAttempt.reverted) {
    log.warning('Adding a ERC20 token with no "decimals". Address: {}', [addressString])
    token.decimals = null
  } else {
    token.decimals = BigInt.fromI32(decimalsAttempt.value)
  }

  // Audit dates
  token.createEpoch = timestamp

  // Transaction
  token.txHash = txHash

  token.save()
  return token
}
