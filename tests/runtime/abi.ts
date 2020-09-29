import { Event, Value, ValueKind } from './ethereum'
import { fromBytesLE, toBytesLE } from './int'

const LE = true
const ENCODING = 'utf-16le'

export type Pointer = number

export class Abi {
  private readonly text = {
    decoder: new TextDecoder(ENCODING),
  }

  constructor(private memory: WebAssembly.Memory, private allocator: (size: number) => Pointer) {}

  private get buffer() {
    return this.memory.buffer
  }

  private get heap() {
    return new Uint8Array(this.buffer)
  }

  private get view() {
    return new DataView(this.buffer)
  }

  private allocate(size: number): Pointer {
    const MAX_SIZE = 0x80000000
    if (size < 1 || size > MAX_SIZE) {
      throw new Error(`allocation size ${size} is invalid`)
    }

    // NOTE: AssemblyScript arena allocator requires allocs to be powers of 2.
    // This is done by shifting `u32::MAX` the number of leading zeros in `size`
    // and then adding `1` to make the next power of two.
    const nextPowerOfTwo = (0xffffffff >>> Math.clz32(size - 1)) + 1

    return this.allocator(nextPowerOfTwo)
  }

  private getWord(ptr: Pointer): number {
    return this.view.getUint32(ptr, LE)
  }

  private setWord(ptr: Pointer, value: number) {
    this.view.setUint32(ptr, value, LE)
  }

  public readArrayBuffer(ptr: Pointer): ArrayBuffer | null {
    if (ptr === 0) {
      return null
    }

    const len = this.getWord(ptr)
    const start = ptr + 8 // 4 bytes padding
    return this.buffer.slice(start, start + len)
  }

  public readBigInt(ptr: Pointer): bigint | null {
    const bytes = this.readUint8Array(ptr)
    if (!bytes) {
      return null
    }

    return fromBytesLE(bytes)
  }

  public readString(ptr: Pointer): string | null {
    if (ptr === 0) {
      return null
    }

    const len = this.getWord(ptr)
    const start = ptr + 4
    const bytes = this.heap.subarray(start, start + len * 2)
    return this.text.decoder.decode(bytes)
  }

  public readUint8Array(ptr: Pointer): Uint8Array | null {
    if (ptr === 0) {
      return null
    }

    const buffer = this.readArrayBuffer(this.getWord(ptr))
    if (buffer === null) {
      throw new Error('Uint8Array with null buffer')
    }

    const offset = this.getWord(ptr + 4)
    const len = this.getWord(ptr + 8)
    const bytes = new Uint8Array(buffer, offset, len)

    return bytes
  }

  private writeArray<T>(values: T[], writer: (value: T) => Pointer): Pointer {
    const ptrs = new Uint32Array(values.length)
    for (let i = 0; i < values.length; i++) {
      ptrs[i] = writer(values[i])
    }

    const ptr = this.allocate(8)
    this.setWord(ptr, this.writeArrayBuffer(ptrs.buffer))
    this.setWord(ptr + 4, values.length)

    return ptr
  }

  public writeArrayBuffer(value: ArrayBuffer | null): Pointer {
    if (value === null) {
      return 0
    }

    const ptr = this.allocate(8 + value.byteLength)
    this.setWord(ptr, value.byteLength)
    this.heap.set(new Uint8Array(value), ptr + 8)

    return ptr
  }

  public writeBigInt(value: bigint | null): Pointer {
    if (value === null) {
      return 0
    }
    const bytes = toBytesLE(value)
    return this.writeUint8Array(bytes)
  }

  public writeEvent(value: Event | null): Pointer {
    if (value === null) {
      return 0
    }

    const blockPtr = this.allocate(56)
    this.setWord(blockPtr, this.writeUint8Array(value.block.hash))
    this.setWord(blockPtr + 4, this.writeUint8Array(value.block.parentHash))
    this.setWord(blockPtr + 8, this.writeUint8Array(value.block.unclesHash))
    this.setWord(blockPtr + 12, this.writeUint8Array(value.block.author))
    this.setWord(blockPtr + 16, this.writeUint8Array(value.block.stateRoot))
    this.setWord(blockPtr + 20, this.writeUint8Array(value.block.transactionsRoot))
    this.setWord(blockPtr + 24, this.writeUint8Array(value.block.receiptsRoot))
    this.setWord(blockPtr + 28, this.writeBigInt(value.block.number))
    this.setWord(blockPtr + 32, this.writeBigInt(value.block.gasUsed))
    this.setWord(blockPtr + 36, this.writeBigInt(value.block.gasLimit))
    this.setWord(blockPtr + 40, this.writeBigInt(value.block.timestamp))
    this.setWord(blockPtr + 44, this.writeBigInt(value.block.difficulty))
    this.setWord(blockPtr + 48, this.writeBigInt(value.block.totalDifficulty))
    this.setWord(blockPtr + 52, this.writeBigInt(value.block.size))

    const txPtr = this.allocate(32)
    this.setWord(txPtr, this.writeUint8Array(value.transaction.hash))
    this.setWord(txPtr + 4, this.writeBigInt(value.transaction.index))
    this.setWord(txPtr + 8, this.writeUint8Array(value.transaction.from))
    this.setWord(txPtr + 12, this.writeUint8Array(value.transaction.to))
    this.setWord(txPtr + 16, this.writeBigInt(value.transaction.value))
    this.setWord(txPtr + 20, this.writeBigInt(value.transaction.gasUsed))
    this.setWord(txPtr + 24, this.writeBigInt(value.transaction.gasPrice))
    this.setWord(txPtr + 28, this.writeUint8Array(value.transaction.input))

    const paramsPtr = this.writeArray(value.parameters, ({ name, value }) => {
      const ptr = this.allocate(8)
      this.setWord(ptr, this.writeString(name))
      this.setWord(ptr + 4, this.writeValue(value))
      return ptr
    })

    const ptr = this.allocate(28)
    this.setWord(ptr, this.writeUint8Array(value.address))
    this.setWord(ptr + 4, this.writeBigInt(value.logIndex))
    this.setWord(ptr + 8, this.writeBigInt(value.transactionLogIndex))
    this.setWord(ptr + 12, this.writeString(value.logType))
    this.setWord(ptr + 16, blockPtr)
    this.setWord(ptr + 20, txPtr)
    this.setWord(ptr + 24, paramsPtr)

    return ptr
  }

  public writeString(value: string | null): Pointer {
    if (value === null) {
      return 0
    }

    const ptr = this.allocate(4 + value.length * 2)
    this.setWord(ptr, value.length)

    const start = ptr + 4
    for (let i = 0; i < value.length; i++) {
      this.view.setUint16(start + i * 2, value.codePointAt(i) || 0, LE)
    }

    return ptr
  }

  public writeUint8Array(value: Uint8Array | null): Pointer {
    if (value === null) {
      return 0
    }

    const bufferPtr = this.writeArrayBuffer(value.buffer)

    const ptr = this.allocate(12)
    this.setWord(ptr, bufferPtr)
    this.setWord(ptr + 4, value.byteOffset)
    this.setWord(ptr + 8, value.length)

    return ptr
  }

  public writeValue(value: Value): Pointer {
    let payload
    switch (value.kind) {
      case ValueKind.Address:
      case ValueKind.FixedBytes:
      case ValueKind.Bytes:
        payload = this.writeUint8Array(value.data)
        break
      case ValueKind.Int:
      case ValueKind.Uint:
        payload = this.writeBigInt(value.data)
        break
      case ValueKind.Bool:
        payload = ~~value.data
        break
      case ValueKind.String:
        payload = this.writeString(value.data)
        break
      case ValueKind.FixedArray:
      case ValueKind.Array:
      case ValueKind.Tuple:
        payload = this.writeArray(value.data, this.writeValue)
        break
      default:
        throw new Error(`invalid ethereum value ${value}`)
    }

    const ptr = this.allocate(16)
    this.setWord(ptr, value.kind)
    this.view.setBigInt64(ptr + 8, BigInt(payload), LE)

    return ptr
  }
}
