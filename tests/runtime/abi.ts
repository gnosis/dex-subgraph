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
    const nextPowerOfTwo = (0xffffffff >> Math.clz32(size - 1)) + 1

    return this.allocator(nextPowerOfTwo)
  }

  public readArrayBuffer(ptr: Pointer): ArrayBuffer | null {
    if (ptr === 0) {
      return null
    }

    const len = this.view.getUint32(ptr, LE)
    const start = ptr + 8 // 4 bytes padding
    return this.buffer.slice(start, start + len)
  }

  public readBigInt(ptr: Pointer): bigint | null {
    if (ptr === 0) {
      return null
    }

    const buffer = this.readArrayBuffer(this.view.getUint32(ptr, LE))
    if (buffer === null) {
      throw new Error('BitInt with null buffer')
    }

    const offset = this.view.getUint32(ptr + 4, LE)
    const len = this.view.getUint32(ptr + 8, LE)

    const bytes = new Uint8Array(buffer, offset, len)
    return fromBytesLE(bytes)
  }

  public readString(ptr: Pointer): string | null {
    if (ptr === 0) {
      return null
    }

    const len = this.view.getUint32(ptr, LE)
    const start = ptr + 4
    const bytes = this.heap.subarray(start, start + len * 2)
    return this.text.decoder.decode(bytes)
  }

  public writeArrayBuffer(value: ArrayBuffer): Pointer {
    const ptr = this.allocate(8 + value.byteLength)

    this.view.setUint32(ptr, value.byteLength, LE)
    this.heap.set(new Uint8Array(value), ptr + 8)

    return ptr
  }

  public writeBigInt(value: bigint): Pointer {
    const bytes = toBytesLE(value)
    const bufferPtr = this.writeArrayBuffer(bytes)

    const ptr = this.allocate(12)
    this.view.setUint32(ptr, bufferPtr, LE)
    this.view.setUint32(ptr + 4, bytes.byteOffset, LE)
    this.view.setUint32(ptr + 8, bytes.length, LE)

    return ptr
  }
}
