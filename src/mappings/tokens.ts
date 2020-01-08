import { log, Address, BigInt, Bytes, EthereumEvent, CallResult } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { AddTokenCall, BatchExchange } from '../../generated/BatchExchange/BatchExchange'
import { Erc20 } from '../../generated/BatchExchange/Erc20'
import { epochToBatchId } from '../utils'

export function onAddToken(call: AddTokenCall): void {
  let address = call.inputs.token
  let timestamp = call.block.timestamp
  let txHash = call.transaction.hash
  
  // Get token id
  let batchExchange = BatchExchange.bind(call.to);
  let tokenId = batchExchange.tokenAddressToIdMap(address)
  log.info('[onAddToken] Add token {} with address', [BigInt.fromI32(tokenId).toString(), address.toHex()])

  // Create token
  let id = BigInt.fromI32(tokenId).toString()
  _createToken(id, address, timestamp, txHash)
  
  // It's possible, that there was already some deposits
  // TODO: Update balances (once balances are implemented)
}

export function createTokenIfNotCreated(tokenId: u32, event: EthereumEvent): Token {
  let id = BigInt.fromI32(tokenId).toString()
  let token = Token.load(id)
  log.info('[createTokenIfNotCreated] Make sure token {} is created', [id])
  
  if (token == null) {
    let batchExchange = BatchExchange.bind(event.address);
    let address = batchExchange.tokenIdToAddressMap(tokenId)

    let timestamp = event.block.timestamp
    let txHash = event.transaction.hash
  
    // Create token if not created
    token = _createToken(id, address, timestamp, txHash)
  }

  return token!
}

export function _createToken(id: string, address: Address, timestamp: BigInt, txHash: Bytes): Token {
  log.info('[createToken] Create Token {} with address {}', [id, address.toHex()])

  // Create token  
  let token = new Token(id)
  token.address = address
  token.fromBatchId = epochToBatchId(timestamp)

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
  token.createEpoch = timestamp

  // Transaction
  token.txHash = txHash

  token.save()
  return token
}
