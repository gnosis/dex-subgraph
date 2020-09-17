export function toBytesLE(value: bigint): Uint8Array {
  if (value === 0n) {
    return new Uint8Array(0)
  }

  const negative = value < 0n
  const valueAbs = negative ? -value : value

  let hex = valueAbs.toString(16)
  if (hex.length & 1) {
    // NOTE: Ensure an even number of bytes.
    hex = `0${hex}`
  }

  // NOTE: For two's compliment, an extra byte is required if the MSb of the
  // MSB of the magnitude of value is 1.
  const msb = parseInt(hex.substr(0, 1), 16)
  const signSpace = msb & 0x8 ? 1 : 0

  const len = hex.length / 2
  const bytes = new Uint8Array(len + signSpace)
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.substr((len - i - 1) * 2, 2), 16)
  }

  if (negative) {
    twosCompliment(bytes)
  }

  return bytes
}

export function fromBytesLE(bytes: Uint8Array): bigint {
  const negative = !!(bytes[bytes.length - 1] & 0x80)
  if (negative) {
    twosCompliment(bytes)
  }

  let result = 0n
  for (let i = bytes.length - 1; i >= 0; i--) {
    result = (result << 8n) | BigInt(bytes[i])
  }

  return negative ? -result : result
}

function twosCompliment(bytes: Uint8Array) {
  let carry = true
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = ~bytes[i]
    if (carry) {
      bytes[i] = (bytes[i] + 1) & 0xff
      carry = bytes[i] === 0
    }
  }
}
