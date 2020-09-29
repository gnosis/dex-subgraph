/**
 * A mock test runtime for loading the AssemblyScript mappings and marshalling
 * test data from TypeScript/JavaScript to AssemblyScript/WebAssembly.
 */

import { promises as fs } from 'fs'
import path from 'path'
import wabt from 'wabt'
import { Abi, Pointer } from './abi'
import { Event, ValueKind } from './ethereum'
import * as Events from './events'
import { addr, toHex } from './hex'
import { Host } from './host'

let CACHED_MODULE: Promise<WebAssembly.Module> | undefined

export class Mappings {
  private constructor(private abi: Abi, private host: Host, private instance: WebAssembly.Instance) {}

  public static async load(): Promise<Mappings> {
    const module = await (CACHED_MODULE = CACHED_MODULE || compile())

    let abi: Abi | null = null
    const host = new Host()
    const instance = await WebAssembly.instantiate(
      module,
      imports(() => {
        if (!abi) {
          throw new Error('ABI encoder not initialized')
        }
        return abi
      }, host),
    )

    const memory = instance.exports['memory'] as WebAssembly.Memory
    const allocate = instance.exports['memory.allocate'] as (size: number) => Pointer
    const start = instance.exports['__start'] as () => void

    abi = new Abi(memory, allocate)
    start()

    return new Mappings(abi, host, instance)
  }

  private handler(name: string, event: Event): void {
    const eventPtr = this.abi.writeEvent(event)
    ;(this.instance.exports[name] as (...a: unknown[]) => void)(eventPtr)
  }

  public onAddToken(): void {
    throw new Error('not implemented')
  }

  public onDeposit(deposit: Events.Deposit, meta?: Events.Metadata): void {
    this.handler(
      'onDeposit',
      Events.newEvent(
        {
          ...{ from: deposit.user },
          ...(meta || {}),
        },
        [
          { name: 'user', value: { kind: ValueKind.Address, data: addr(deposit.user) } },
          { name: 'token', value: { kind: ValueKind.Address, data: addr(deposit.token) } },
          { name: 'amount', value: { kind: ValueKind.Uint, data: deposit.amount } },
          { name: 'batchId', value: { kind: ValueKind.Uint, data: BigInt(deposit.batchId) } },
        ],
      ),
    )
  }
}

async function compile(): Promise<WebAssembly.Module> {
  const modulePath = path.join(__dirname, '../../build/BatchExchange/BatchExchange.wasm')
  const buffer = await fs.readFile(modulePath)

  // NOTE: The compiled AssemblyScript WebAssembly module calls exports in its
  // `start` initialization method that **require** exports to work (for example
  // 'index/bigInt.pow' which requires the exported `memory`). This,
  // unfortunately is not supported with the JavaScript WebAssembly API. To
  // work around this, we disable the `start` function and add it as an export
  // to be called manually **after** the module has been compiled.
  const wat = await wasm2wat(buffer)
  const adjustedWat = wat.replace(/\(start (.*)\)/, '(export "__start" (func $1))')
  const wasm = await wat2wasm('BatchExchange.wasm', adjustedWat)

  return WebAssembly.compile(wasm)
}

function imports(abi: () => Abi, host: Host): WebAssembly.Imports {
  const nonnull = <T>(value: T | null | undefined) => {
    if (value === null || value === undefined) {
      throw new Error('unexpected null WebAssembly value')
    }
    return value
  }

  const readBytes = (ptr: Pointer) => nonnull(abi().readUint8Array(ptr))
  const readInt = (ptr: Pointer) => nonnull(abi().readBigInt(ptr))
  const readStr = (ptr: Pointer) => nonnull(abi().readString(ptr))
  const writeInt = (val: bigint) => abi().writeBigInt(val)
  const writeStr = (val: string) => abi().writeString(val)

  const todo = () => {
    throw new Error('not implemented')
  }

  return {
    env: {
      abort: (message: Pointer, fileName: Pointer, line: number, column: number) => {
        host.abort(readStr(message), abi().readString(fileName), line, column)
      },
    },
    index: {
      'bigInt.dividedBy': (x: Pointer, y: Pointer) => writeInt(readInt(x) / readInt(y)),
      'bigInt.minus': (x: Pointer, y: Pointer) => writeInt(readInt(x) - readInt(y)),
      'bigInt.mod': (x: Pointer, y: Pointer) => writeInt(readInt(x) % readInt(y)),
      'bigInt.plus': (x: Pointer, y: Pointer) => writeInt(readInt(x) + readInt(y)),
      'bigInt.pow': (x: Pointer, exp: number) => writeInt(readInt(x) ** BigInt(exp)),
      'bigInt.times': (x: Pointer, y: Pointer) => writeInt(readInt(x) * readInt(y)),
      'log.log': (level: number, message: Pointer) => {
        host.log.log(level, readStr(message))
      },
      'store.get': todo,
      'store.set': todo,
      'typeConversion.bigIntToString': (x: Pointer) => writeStr(readInt(x).toString()),
      'typeConversion.bytesToHex': (x: Pointer) => writeStr(toHex(readBytes(x))),
    },
    ethereum: {
      'ethereum.call': todo,
    },
  }
}

const WABT = wabt()

async function wasm2wat(wasm: Buffer): Promise<string> {
  const module = (await WABT).readWasm(wasm, { readDebugNames: true })
  module.applyNames()
  return module.toText({ foldExprs: false, inlineExport: false })
}

async function wat2wasm(filename: string, wat: string): Promise<ArrayBuffer> {
  const module = (await WABT).parseWat(filename, wat)
  const { buffer } = module.toBinary({
    log: false,
    canonicalize_lebs: false,
    relocatable: false,
    write_debug_names: true,
  })

  return buffer.buffer
}
