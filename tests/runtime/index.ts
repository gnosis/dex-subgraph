/**
 * A mock test runtime for loading the AssemblyScript mappings and marshalling
 * test data from TypeScript/JavaScript to AssemblyScript/WebAssembly.
 */

import { promises as fs } from 'fs'
import path from 'path'
import { Abi } from './abi'
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

    abi = new Abi(instance.exports.memory as WebAssembly.Memory)
    return new Mappings(abi, host, instance)
  }

  private handler(name: string, ...args: unknown[]): void {
    ;(this.instance.exports[name] as (...a: unknown[]) => void)(...args)
  }

  public onAddToken(): void {
    this.handler('onAddToken')
  }
}

async function compile(): Promise<WebAssembly.Module> {
  const modulePath = path.join(__dirname, '../../build/BatchExchange/BatchExchange.wasm')
  const buffer = await fs.readFile(modulePath)
  return WebAssembly.compile(buffer)
}

function imports(abi: () => Abi, host: Host): WebAssembly.Imports {
  const nonnull = <T>(value: T | null | undefined) => {
    if (value === null || value === undefined) {
      throw new Error('unexpected null WebAssembly value')
    }
    return value
  }
  const todo = () => {
    throw new Error('not implemented')
  }

  return {
    env: {
      abort: (message: number, fileName: number, line: number, column: number) => {
        host.abort(nonnull(abi().readString(message)), abi().readString(fileName), line, column)
      },
    },
    index: {
      'bigInt.dividedBy': todo,
      'bigInt.minus': todo,
      'bigInt.mod': todo,
      'bigInt.plus': todo,
      'bigInt.pow': todo,
      'bigInt.times': todo,
      'log.log': todo,
      'store.get': todo,
      'store.set': todo,
      'typeConversion.bigIntToString': todo,
      'typeConversion.bytesToHex': todo,
    },
    ethereum: {
      'ethereum.call': todo,
    },
  }
}
