import { log } from '@graphprotocol/graph-ts'
import { Withdraw as WithdrawEvent, WithdrawRequest as WithdrawRequestEvent } from '../../generated/BatchExchange/BatchExchange'
import { Withdraw } from '../../generated/schema'
import { epochToBatchId, toEventId } from '../utils'
import { createUserIfNotCreated } from './users'

export function onWithdraw(event: WithdrawEvent): void {
  // Create withdraw
  _createWithdraw(event)
}

export function onWithdrawRequest(event: WithdrawRequestEvent): void {
  log.info('[onWithdrawRequest] New Withdraw Request: {} - TODO', [event.transaction.hash.toHex()])

  // Make sure user is created
  createUserIfNotCreated(event.params.user, event)

  // Create request event
  // TODO:
}

export function _createWithdraw(event: WithdrawEvent): Withdraw {
  let params = event.params;
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
  withdraw.createEpoch = epochToBatchId(timestamp)

  // Transaction
  withdraw.txHash = event.transaction.hash

  withdraw.save()
  return withdraw
}

