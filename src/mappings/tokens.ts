import { log, Address, BigInt, Bytes, EthereumEvent } from '@graphprotocol/graph-ts'
import { Token } from '../../generated/schema'
import { AddTokenCall, BatchExchange } from '../../generated/BatchExchange/BatchExchange'
import { epochToBatchId } from '../utils'

export function onAddToken(call: AddTokenCall): void {
  let address = call.inputs.token
  let timestamp = call.block.timestamp
  let txHash = call.transaction.hash
  createToken(address, timestamp, txHash)
}

export function createTokenIfNotCreated(tokenId: number, event: EthereumEvent): Token {
  let token = Token.load(BigInt.fromI32(tokenId).toString())
  if (token == null) {  
    let batchExchange = BatchExchange.bind(event.address);    

    let address = batchExchange.tokenIdToAddressMap(tokenId)
    let timestamp = event.block.timestamp
    let txHash = event.transaction.hash
    
    token = createToken(address, timestamp, txHash)
  }

  return token
}


export function createToken(address: Address, timestamp: BigInt, txHash: Bytes): Token {
  // Create token
  log.info('[onAddToken] Create Token: {}', [address.toHex()])
  let token = new Token(address.toHex())
  token.address = address
  token.fromBatchId = epochToBatchId(timestamp)

  // Audit dates
  token.createEpoch = timestamp

  // Transaction
  token.txHash = txHash

  token.save()

  return token
}