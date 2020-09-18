import { toHex } from './runtime/convert'
import { Entity, Value, ValueKind } from './runtime/store'

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
        txHash: getBytes(entity, 'txHash'),
      }
    default:
      throw new Error(`unknown entity ${name}`)
  }
}

type ValueOf<T extends ValueKind> = Extract<Value, { kind: T }>['data']

function toValueOf<T extends ValueKind>(value: Value, kind: T): ValueOf<T> {
  if (value.kind === kind) {
    return value.data as ValueOf<T>
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

function getBytes(entity: Entity, key: string): string {
  return toHex(getValueOf(entity, key, ValueKind.Bytes))
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getArrayOf<T extends ValueKind>(entity: Entity, key: string, kind: T): ValueOf<T>[] {
  // NOTE: We have to cast the closure to `any` to appease the type checker.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getValueOf(entity, key, ValueKind.Array).map(((v: Value) => toValueOf(v, kind)) as any)
}
