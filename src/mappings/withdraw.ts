import { log } from '@graphprotocol/graph-ts'
import {
  Withdraw as WithdrawEvent,
  WithdrawRequest as WithdrawRequestEvent,
} from '../../generated/BatchExchange/BatchExchange'
import { Withdraw, WithdrawRequest } from '../../generated/schema'
import { epochToBatchId, toEventId } from '../utils'
import { createUserIfNotCreated } from './users'

export function onWithdraw(event: WithdrawEvent): void {
  log.info('[onWithdraw] New Withdraw. Tx: {}', [event.transaction.hash.toHex()])

  // Create withdraw
  _createWithdraw(event)
}

export function onWithdrawRequest(event: WithdrawRequestEvent): void {
  log.info('[onWithdrawRequest] New Withdraw Request. Tx: {}', [event.transaction.hash.toHex()])

  // Make sure user is created
  createUserIfNotCreated(event.params.user, event)

  // Create request event
  _createWithdrawRequest(event)
}

export function _createWithdraw(event: WithdrawEvent): Withdraw {
  let params = event.params
  let id = toEventId(event)
  log.info('[createWithdraw] Create Withdraw {}', [id])

  // Create withdraw / withdrawRequest
  let timestamp = event.block.timestamp
  let withdraw = new Withdraw(id)
  withdraw.amount = params.amount
  withdraw.user = params.user.toHex()
  withdraw.tokenAddress = params.token

  // Audit dates
  withdraw.createEpoch = timestamp
  withdraw.createBatchId = epochToBatchId(timestamp)

  // Transaction
  withdraw.txHash = event.transaction.hash

  withdraw.save()
  return withdraw
}

export function _createWithdrawRequest(event: WithdrawRequestEvent): WithdrawRequest {
  let params = event.params
  let id = toEventId(event)
  log.info('[createWithdrawRequest] Create Withdraw Request {}', [id])

  // Create withdraw / withdrawRequest
  let timestamp = event.block.timestamp
  let withdrawRequest = new WithdrawRequest(id)

  // Params
  withdrawRequest.user = params.user.toHex()
  withdrawRequest.tokenAddress = params.token
  withdrawRequest.amount = params.amount
  withdrawRequest.withdrawableFromBatchId = params.batchId

  // Audit dates
  withdrawRequest.createEpoch = timestamp
  withdrawRequest.createBatchId = epochToBatchId(timestamp)

  // Transaction
  withdrawRequest.txHash = event.transaction.hash

  withdrawRequest.save()
  return withdrawRequest
}
