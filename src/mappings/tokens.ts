import { log, Address, BigInt, Bytes, EthereumEvent } from '@graphprotocol/graph-ts'
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

  // Create token
  createToken(tokenId, address, timestamp, txHash)
}

export function createTokenIfNotCreated(tokenId: u32, event: EthereumEvent): Token {
  let id = BigInt.fromI32(tokenId).toString()
  let token = Token.load(id)
  log.info('[createTokenIfNotCreated] Get Token: {}', [id])
  if (token == null) {
    let batchExchange = BatchExchange.bind(event.address);    
    let address = batchExchange.tokenIdToAddressMap(tokenId)
    let timestamp = event.block.timestamp
    let txHash = event.transaction.hash
    
    token = createToken(tokenId, address, timestamp, txHash)
  }

  return token!
}


export function createToken(tokenId: u32, address: Address, timestamp: BigInt, txHash: Bytes): Token {
  let id = BigInt.fromI32(tokenId).toString()
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
  } else {
    token.symbol = symbolAttempt.value
  }

  // Add name (optional)
  let nameAttempt = erc20.try_name()
  if (nameAttempt.reverted) {
    log.warning('Adding a ERC20 token with no "name". Address: {}', [address.toHex()])
  } else {
    token.name = nameAttempt.value
  }

  // Add decimals (optional)
  let decimalsAttempt = erc20.try_decimals()
  if (decimalsAttempt.reverted) {
    log.warning('Adding a ERC20 token with no "decimals". Address: {}', [address.toHex()])
  } else {
    token.decimals = decimalsAttempt.value
  }

  // Audit dates
  token.createEpoch = timestamp

  // Transaction
  token.txHash = txHash

  token.save()

  return token
}