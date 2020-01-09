import { log, BigInt, EthereumEvent } from '@graphprotocol/graph-ts'
// import {  } from '../utils'

export function createBatchIfNotCreated(batchId: BigInt, event: EthereumEvent): Batch {
  let id = batchId.toString()
  log.info('[createBatchIfNotCreated] Make sure batch {} is created', [id])
  
  // let token = Token.load(id)
  // if (token == null) {
  //   let batchExchange = BatchExchange.bind(event.address);
  //   let address = batchExchange.tokenIdToAddressMap(tokenId)

  //   let timestamp = event.block.timestamp
  //   let txHash = event.transaction.hash
  
  //   // Create token if not created
  //   token = _createToken(id, address, timestamp, txHash)
  // }

  // return token!
}
