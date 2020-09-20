import { fromHex, toHex } from './runtime/convert'
import { Entity, Entry, Value, ValueKind } from './runtime/store'

export interface User {
  id: string
  fromBatchId: bigint
  createEpoch: bigint
  txHash: string
}

/* eslint-disable prettier/prettier */
interface Entities {
  'User': User
}
/* eslint-enable prettier/prettier */

export type Names = keyof Entities
export type Data<T extends Names> = Entities[T]

export function toData<T extends Names>(name: T, entity: Entity): Data<T> {
  switch (name) {
    case 'User':
      return {
        id: getValueOf(entity, 'id', ValueKind.String),
        fromBatchId: getValueOf(entity, 'fromBatchId', ValueKind.BigInt),
        createEpoch: getValueOf(entity, 'createEpoch', ValueKind.BigInt),
        txHash: getValueOf(entity, 'txHash', ValueKind.Bytes),
      }
    default:
      throw new Error(`unknown entity ${name}`)
  }
}

export function fromData<T extends Names>(name: T, data: Data<T>): Entity {
  switch (name) {
    case 'User':
      return {
        entries: [
          getEntry(<User>data, 'id', ValueKind.String),
          getEntry(<User>data, 'fromBatchId', ValueKind.BigInt),
          getEntry(<User>data, 'createEpoch', ValueKind.BigInt),
          getEntry(<User>data, 'txHash', ValueKind.Bytes),
        ],
      }
    default:
      throw new Error(`unknown entity ${name}`)
  }
}

type ValueOf<T extends ValueKind> = T extends ValueKind.Bytes ? string : Extract<Value, { kind: T }>['data']

function toValueOf<T extends ValueKind>(value: Value, kind: T): ValueOf<T> {
  if (value.kind === kind) {
    // NOTE: Casting is necessary since as the type checker doesn't realize
    // that `ValueOf<kind> === ValueOf<value.kind>`.
    switch (value.kind) {
      case ValueKind.Bytes:
        return toHex(value.data) as ValueOf<T>
      default:
        return value.data as ValueOf<T>
    }
  } else {
    const n = (kind: ValueKind) => ValueKind[kind] || 'unknown'
    throw new Error(`expected ${n(kind)} store value but got ${n(value.kind)}`)
  }
}

function getValueOf<T extends ValueKind>(entity: Entity, key: string, kind: T): ValueOf<T> {
  const entry = entity.entries.find(({ name }) => name === key)
  if (entry === undefined) {
    throw new Error(`entity missing '${key}' entry`)
  }
  return toValueOf(entry.value, kind)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getArrayOf<T extends ValueKind>(entity: Entity, key: string, kind: T): ValueOf<T>[] {
  // NOTE: We have to cast the closure to `any` to appease the type checker.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getValueOf(entity, key, ValueKind.Array).map(((v: Value) => toValueOf(v, kind)) as any)
}

function fromValueOf<T extends ValueKind>(data: ValueOf<T>, kind: T): Value {
  switch (kind) {
    case ValueKind.Bytes:
      return { kind, data: fromHex(data as string) } as Value
    default:
      return { kind, data } as Value
  }
}

type KindOf<T> = T extends string ? ValueKind.String | ValueKind.Bytes : Extract<Value, { data: T }>['kind']

function getEntry<T, K extends keyof T>(data: T, key: K, kind: KindOf<T[K]>): Entry {
  return {
    name: key.toString(),
    value: fromValueOf(data[key] as ValueOf<typeof kind>, kind),
  }
}
