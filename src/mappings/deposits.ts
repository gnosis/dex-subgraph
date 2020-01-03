import { log } from '@graphprotocol/graph-ts'
import { Deposit as DepositEvent } from '../../generated/BatchExchange/BatchExchange'

export function onDeposit(event: DepositEvent): void {
  log.info('[onDeposit] New Deposit: {} - TODO', [event.transaction.hash.toHex()])
}
