import { log } from '@graphprotocol/graph-ts'
import { Deposit as DepositEvent } from '../../generated/BatchExchange/BatchExchange'

export function onWithdraw(event: DepositEvent): void {
  log.info('[onWithdraw] New Withdraw: {} - TODO', [event.transaction.hash.toHex()])
}

export function onWithdrawRequest(event: DepositEvent): void {
  log.info('[onWithdrawRequest] New Withdraw Request: {} - TODO', [event.transaction.hash.toHex()])
}
