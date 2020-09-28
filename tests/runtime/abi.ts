const LE = true
const ENCODING = 'utf-16le'

export type Pointer = number

export class Abi {
  private text = {
    decoder: new TextDecoder(ENCODING),
  }

  constructor(private memory: WebAssembly.Memory) {}

  private get heap() {
    return new Uint8Array(this.memory.buffer)
  }

  private get view() {
    return new DataView(this.memory.buffer)
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
}
