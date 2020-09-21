import { fromHex, toHex } from './convert'
import { Entity, Entry, Value, ValueKind } from './store'

export type RecursiveValueKind = Exclude<ValueKind, ValueKind.Array> | readonly [RecursiveValueKind]
export type Definition = Record<string, RecursiveValueKind>

export type ValueOf<T> = T extends ValueKind.Array
  ? never
  : T extends ValueKind.Bytes
  ? string
  : T extends readonly [infer S]
  ? ValueOf<S>[]
  : Extract<Value, { kind: T }>['data']

export type Data<T> = {
  [K in keyof T]: ValueOf<T[K]>
}

export function toData<D extends Definition>(definition: D, entity: Entity): Data<D> {
  const data: Record<string, unknown> = {}
  for (const [key, kind] of Object.entries(definition)) {
    const entry = entity.entries.find(({ name }) => name === key)
    if (entry === undefined) {
      throw new Error(`entity missing '${key}' entry`)
    }

    data[key] = coerceFromValue(entry.value, kind)
  }

  return data as Data<D>
}

export function fromData<D extends Definition>(definition: D, data: Data<D>): Entity {
  const entries: Entry[] = []
  const dataProperties = data as Record<string, unknown>
  for (const [key, kind] of Object.entries(definition)) {
    entries.push({ name: key, value: coerceToValue(dataProperties[key], kind) })
  }

  return { entries }
}

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
