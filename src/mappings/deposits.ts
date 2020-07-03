import { log } from '@graphprotocol/graph-ts'
import { Deposit as DepositEvent } from '../../generated/BatchExchange/BatchExchange'
import { Deposit } from '../../generated/schema'
import { toEventId } from '../utils'
import { createUserIfNotCreated } from './users'
// import { createTokenIfNotCreated } from './tokens'

export function onDeposit(event: DepositEvent): void {
  let params = event.params
  log.info('[onDeposit] New Deposit: {}', [event.transaction.hash.toHex()])

  // Create user and token
  createUserIfNotCreated(params.user, event)
  // createTokenIfNotCreated(params.token, event) // TODO: Revisit this. We shouldn't add a token because a user does a deposit

  // Create deposit
  let depositId = toEventId(event)
  let deposit = new Deposit(depositId)
  deposit.user = params.user.toHex()
  deposit.tokenAddress = params.token
  deposit.amount = params.amount
  deposit.batchId = params.batchId

  // Audit dates
  deposit.createEpoch = event.block.timestamp

  // Transaction
  deposit.txHash = event.transaction.hash
  deposit.save()
}
