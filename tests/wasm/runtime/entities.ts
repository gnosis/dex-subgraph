import { fromHex, toHex } from './convert'
import { Entity, Entry, Value, ValueKind } from './store'

type ValueOf<T> = T extends ValueKind.Array
  ? never
  : T extends ValueKind.Bytes
  ? string
  : T extends readonly [infer S]
  ? ValueOf<S>[]
  : Extract<Value, { kind: T }>['data']

type EntityProperties<T> = {
  [K in keyof T]: ValueOf<T[K]>
}

type RecursiveValueKind = Exclude<ValueKind, ValueKind.Array> | readonly [RecursiveValueKind]
type Definitions = Record<string, Record<string, RecursiveValueKind>>

export type Names<D> = keyof D
export type Data<D, K extends Names<D>> = EntityProperties<D[K]>

export function toData<D extends Definitions, K extends Names<D>>(definitions: D, name: K, entity: Entity): Data<D, K> {
  const data: Record<string, unknown> = {}
  for (const [key, kind] of Object.entries(definitions[name])) {
    const entry = entity.entries.find(({ name }) => name === key)
    if (entry === undefined) {
      throw new Error(`entity missing '${key}' entry`)
    }

    data[key] = coerceFromValue(entry.value, kind)
  }

  return data as Data<D, K>
}

export function fromData<D extends Definitions, K extends Names<D>>(definitions: D, name: K, data: Data<D, K>): Entity {
  const entries: Entry[] = []
  const dataProperties = data as Record<string, unknown>
  for (const [key, kind] of Object.entries(definitions[name])) {
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
