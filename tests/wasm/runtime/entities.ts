import { fromHex, toHex } from './convert'
import { Entity, Entry, Value, ValueKind } from './store'

export type SimpleValueKind = Exclude<ValueKind, ValueKind.Array | ValueKind.Null>
export type EntityValueKind = SimpleValueKind | readonly [SimpleValueKind] | { readonly optional: SimpleValueKind }
export type Definition = Record<string, EntityValueKind>

export type RawValueOf<T> = T extends ValueKind.Array | ValueKind.Null
  ? never
  : T extends ValueKind.Bytes
  ? string
  : Extract<Value, { kind: T }>['data']
export type ValueOf<T> = T extends readonly [infer S]
  ? RawValueOf<S>[]
  : T extends { readonly optional: infer S }
  ? RawValueOf<S> | null
  : RawValueOf<T>

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

function isArray(kind: EntityValueKind): kind is readonly [SimpleValueKind] {
  return Array.isArray(kind)
}

function isOptional(kind: EntityValueKind): kind is { readonly optional: SimpleValueKind } {
  return typeof kind === 'object' && 'optional' in kind
}

function coerceFromValue(value: Value, kind: EntityValueKind): unknown {
  if (isArray(kind)) {
    if (value.kind !== ValueKind.Array) {
      throw unexpectedKindError(value, ValueKind.Array)
    }
    return value.data.map((value) => coerceFromSimpleValue(value, kind[0]))
  } else if (isOptional(kind)) {
    if (value.kind === ValueKind.Null) {
      return null
    }
    return coerceFromSimpleValue(value, kind.optional)
  } else {
    return coerceFromSimpleValue(value, kind)
  }
}

function coerceFromSimpleValue(value: Value, kind: SimpleValueKind): unknown {
  if (value.kind !== kind) {
    throw unexpectedKindError(value, kind)
  }

  switch (value.kind) {
    case ValueKind.Bytes:
      return toHex(value.data)
    default:
      return value.data
  }
}

function unexpectedKindError(value: Value, expectedKind: ValueKind) {
  if (value.kind !== expectedKind) {
    const n = (kind: ValueKind) => ValueKind[kind] || 'unknown'
    return new Error(`expected ${n(expectedKind)} store value but got ${n(value.kind)}`)
  }
}

function coerceToValue(data: unknown, kind: EntityValueKind): Value {
  if (isArray(kind)) {
    return {
      kind: ValueKind.Array,
      data: (data as unknown[]).map((data) => coerceToSimpleValue(data, kind[0])),
    }
  } else if (isOptional(kind)) {
    if (data === null) {
      return { kind: ValueKind.Null, data: null }
    }
    return coerceToSimpleValue(data, kind.optional)
  } else {
    return coerceToSimpleValue(data, kind)
  }
}

function coerceToSimpleValue(data: unknown, kind: SimpleValueKind): Value {
  switch (kind) {
    case ValueKind.Bytes:
      return { kind, data: fromHex(data as string) }
    default:
      return { kind, data } as Value
  }
}
