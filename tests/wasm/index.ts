/**
 * A mock test runtime for loading the AssemblyScript mappings and marshalling
 * test data from TypeScript/JavaScript to AssemblyScript/WebAssembly.
 */

import fs from 'fs'
import path from 'path'
import { Module, Runtime } from './runtime'
import { CallHandler } from './runtime/chain'
import { fromEntityData, toEntityData, toEvent, EntityNames, EntityData, EventData, EventMetadata } from './definitions'

// NOTE: Use `readFileSync` here so that we pay the price of reading the Wasm
// binary when loading this file, instead of when creating the `Mappings` module
// for the first time to avoid Mocha incorrectly flagging the first test that
// runs as being "slow".
const MODULE_WASM = fs.readFileSync(path.join(__dirname, '../../build/BatchExchange/BatchExchange.wasm'))
const MODULE = Module.compile('BatchExchange.wasm', MODULE_WASM)

export class Mappings {
  private constructor(private readonly runtime: Runtime) {}

  public static async load(): Promise<Mappings> {
    const runtime = await Runtime.instantiate(await MODULE)
    return new Mappings(runtime)
  }

  public onDeposit(deposit: EventData<'Deposit'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onDeposit', toEvent('Deposit', deposit, meta))
  }

  public onOrderCancellation(order: EventData<'OrderCancellation'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onOrderCancellation', toEvent('OrderCancellation', order, meta))
  }

  public onOrderDeletion(order: EventData<'OrderDeletion'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onOrderDeletion', toEvent('OrderDeletion', order, meta))
  }

  public onOrderPlacement(order: EventData<'OrderPlacement'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onOrderPlacement', toEvent('OrderPlacement', order, meta))
  }

  public onSolutionSubmission(solution: EventData<'SolutionSubmission'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onSolutionSubmission', toEvent('SolutionSubmission', solution, meta))
  }

  public onTokenListing(tokenListing: EventData<'TokenListing'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onTokenListing', toEvent('TokenListing', tokenListing, meta))
  }

  public onTrade(trade: EventData<'Trade'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onTrade', toEvent('Trade', trade, meta))
  }

  public onTradeReversion(trade: EventData<'TradeReversion'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onTradeReversion', toEvent('TradeReversion', trade, meta))
  }

  public onWithdraw(withdraw: EventData<'Withdraw'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onWithdraw', toEvent('Withdraw', withdraw, meta))
  }

  public onWithdrawRequest(withdraw: EventData<'WithdrawRequest'>, meta?: EventMetadata): void {
    this.runtime.eventHandler('onWithdrawRequest', toEvent('WithdrawRequest', withdraw, meta))
  }

  public getEntity<T extends EntityNames>(name: T, id: string): EntityData<T> | null {
    const entity = this.runtime.getEntity(name, id)
    if (entity === null) {
      return null
    }

    return toEntityData(name, entity)
  }

  public setEntity<T extends EntityNames>(name: T, id: string, data: EntityData<T>): void {
    const entity = fromEntityData(name, data)
    this.runtime.setEntity(name, id, entity)
  }

  public setCallHandler(call: CallHandler): void {
    this.runtime.setEth({ call })
  }
}
