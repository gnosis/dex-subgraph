/**
 * A mock test runtime for loading the AssemblyScript mappings and marshalling
 * test data from TypeScript/JavaScript to AssemblyScript/WebAssembly.
 */

import fs from 'fs'
import path from 'path'
import { Module, Runtime } from './runtime'
import * as Entities from './entities'
import * as Events from './events'

// NOTE: Use `readFileSync` here so that we pay the price of reading the Wasm
// binary when loading this file, instead of when creating the `Mappings` module
// for the first time to avoid Mocha incorrectly flagging the first test that
// runs as being "slow".
const MODULE_WASM = fs.readFileSync(path.join(__dirname, '../../build/BatchExchange/BatchExchange.wasm'))
const MODULE = Module.compile('BatchExchange.wasm', MODULE_WASM)

export class Mappings {
  private constructor(private runtime: Runtime) {}

  public static async load(): Promise<Mappings> {
    const runtime = await Runtime.instantiate(await MODULE)
    return new Mappings(runtime)
  }

  public onDeposit(deposit: Events.Deposit, meta?: Events.Metadata): void {
    this.runtime.eventHandler('onDeposit', Events.deposit(deposit, meta))
  }

  public getEntity<T extends Entities.Names>(name: T, id: string): Entities.Data<T> | null {
    const entity = this.runtime.getEntity(name, id)
    if (entity === null) {
      return null
    }

    return Entities.toData(name, entity)
  }

  public setEntity<T extends Entities.Names>(name: T, id: string, data: Entities.Data<T>): void {
    const entity = Entities.fromData(name, data)
    this.runtime.setEntity(name, id, entity)
  }
}
