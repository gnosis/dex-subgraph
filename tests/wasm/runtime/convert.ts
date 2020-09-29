import { Address, Hash } from './ethereum'

export function addrToBytes(addr: string): Address {
  return fixedLengthHex(addr, 20)
}

export function hashToBytes(hash: string): Hash {
  return fixedLengthHex(hash, 32)
}

function fixedLengthHex(hex: string, len: number): Uint8Array {
  const hexLen = len * 2 + 2
  if (hex.length !== hexLen || !hex.match(/^0x[0-9A-Fa-f]*$/)) {
    throw new Error(`invalid ${len}-byte hex string '${hex}'`)
  }

  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.substr(2 + i * 2, 2), 16)
  }

  return bytes
}

export function toHex(bytes: Uint8Array): string {
  let str = '0x'
  for (let i = 0; i < bytes.length; i++) {
    str += bytes[i].toString(16).padStart(2, '0')
  }

  return str
}
