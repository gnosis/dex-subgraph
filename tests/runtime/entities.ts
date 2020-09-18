import { toHex } from './hex'
import { Entity, Value as StoreValue, ValueKind } from './host/store'

export type Value = bigint | boolean | null | number | string | Value[]

export type Data = Record<string, Value | undefined>

export function toData(entity: Entity): Data {
  const data: Data = {}
  for (const { name, value } of entity.entries) {
    data[name] = value !== null ? coerceValue(value) : null
  }

  return data
}

function coerceValue(value: StoreValue): Value {
  switch (value.kind) {
    case ValueKind.BigDecimal:
      throw new Error('big decimal values not supported')
    case ValueKind.Array:
      return value.data.map(coerceValue)
    case ValueKind.Bytes:
      return toHex(value.data)
    default:
      return value.data
  }
}
