import { fromHex, toHex } from './runtime/convert'
import { Entity, Entry, Value, ValueKind } from './runtime/store'

const Kinds = {
  User: {
    id: ValueKind.String,
    fromBatchId: ValueKind.BigInt,
    createEpoch: ValueKind.BigInt,
    txHash: ValueKind.Bytes,
  },
  Deposit: {
    id: ValueKind.String,
    user: ValueKind.String,
    tokenAddress: ValueKind.Bytes,
    amount: ValueKind.BigInt,
    batchId: ValueKind.BigInt,
    createEpoch: ValueKind.BigInt,
    txHash: ValueKind.Bytes,
  },
} as const

type ValueOf<T> = T extends ValueKind.Array
  ? never
  : T extends ValueKind.Bytes
  ? string
  : T extends readonly [infer S]
  ? ValueOf<S>[]
  : Extract<Value, { kind: T }>['data']

type EntityData<T> = {
  [K in keyof T]: ValueOf<T[K]>
}

export type Names = keyof typeof Kinds
export type Data<K extends Names> = EntityData<typeof Kinds[K]>

export function toData<K extends Names>(name: K, entity: Entity): Data<K> {
  const data: Record<string, unknown> = {}
  for (const [key, kind] of Object.entries(Kinds[name])) {
    const entry = entity.entries.find(({ name }) => name === key)
    if (entry === undefined) {
      throw new Error(`entity missing '${key}' entry`)
    }

    data[key] = coerceFromValue(entry.value, kind)
  }

  return data as Data<K>
}

export function fromData<K extends Names>(name: K, data: Data<K>): Entity {
  const entries: Entry[] = []
  const dataProperties = data as Record<string, unknown>
  for (const [key, kind] of Object.entries(Kinds[name])) {
    entries.push({ name: key, value: coerceToValue(dataProperties[key], kind) })
  }

  return { entries }
}

type RecursiveValueKind = Exclude<ValueKind, ValueKind.Array> | readonly [RecursiveValueKind]

function isRecursive(kind: RecursiveValueKind): kind is readonly [RecursiveValueKind] {
  return Array.isArray(kind)
}

function coerceFromValue(value: Value, kind: RecursiveValueKind): unknown {
  const unexpectedKindError = (expectedKind: ValueKind) => {
    const n = (kind: ValueKind) => ValueKind[kind] || 'unknown'
    return new Error(`expected ${n(expectedKind)} store value but got ${n(value.kind)}`)
  }

  if (isRecursive(kind)) {
    if (value.kind !== ValueKind.Array) {
      throw unexpectedKindError(ValueKind.Array)
    }
    return value.data.map((value) => coerceFromValue(value, kind[0]))
  }

  if (value.kind !== kind) {
    throw unexpectedKindError(kind)
  }
  switch (value.kind) {
    case ValueKind.Bytes:
      return toHex(value.data)
    default:
      return value.data
  }
}

function coerceToValue(data: unknown, kind: RecursiveValueKind): Value {
  if (isRecursive(kind)) {
    return {
      kind: ValueKind.Array,
      data: (data as unknown[]).map((data) => coerceToValue(data, kind[0])),
    }
  }

  switch (kind) {
    case ValueKind.Bytes:
      return { kind, data: fromHex(data as string) }
    default:
      return { kind, data } as Value
  }
}
