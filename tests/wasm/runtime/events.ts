import { addrToBytes, fromHex, hashToBytes } from './convert'
import { Address, Block, Event, EventParam, Hash, Transaction, Value, ValueKind } from './ethereum'

export const ZERO_ADDRESS = addrToBytes(`0x${'00'.repeat(20)}`)
export const ZERO_HASH = hashToBytes(`0x${'00'.repeat(32)}`)
export const EMPTY_INPUT = new Uint8Array(0)

export type MetadataProperty = Uint8Array | bigint | boolean | string | null
export type MetadataPropertyLike<T extends MetadataProperty> = T extends Uint8Array
  ? Uint8Array | string
  : T extends bigint
  ? bigint | number
  : T

export type MetadataProperties<T> = {
  [K in keyof T]?: T[K] extends (infer S)[]
    ? MetadataProperties<S>[]
    : T[K] extends MetadataProperty
    ? MetadataPropertyLike<T[K]>
    : MetadataProperties<T[K]>
}

export type Metadata = MetadataProperties<Omit<Event, 'parameters'>>

export type SimpleValueKind = Exclude<ValueKind, ValueKind.FixedArray | ValueKind.Array | ValueKind.Tuple>
export type EventValueKind = SimpleValueKind | readonly [SimpleValueKind] | SimpleValueKind[]
export type Definition = Record<string, EventValueKind>

export type RawValueOf<T> = T extends ValueKind.Address | ValueKind.FixedBytes | ValueKind.Bytes
  ? Uint8Array | string
  : T extends ValueKind.Int | ValueKind.Uint
  ? bigint | number
  : T extends SimpleValueKind
  ? Extract<Value, { kind: T }>['data']
  : never
export type ValueOf<T> = T extends readonly [infer S]
  ? RawValueOf<S>[]
  : T extends SimpleValueKind[]
  ? unknown[]
  : RawValueOf<T>

export type Data<T> = {
  [K in keyof T]: ValueOf<T[K]>
}

export function toEvent<D extends Definition>(definition: D, data: Data<D>, meta?: Metadata): Event {
  const parameters: EventParam[] = []
  const dataProperties = data as Record<string, unknown>
  for (const [key, kind] of Object.entries(definition)) {
    parameters.push({ name: key, value: coerceToParameter(dataProperties[key], kind) })
  }

  return newEvent(parameters, meta)
}

function isArray(kind: EventValueKind): kind is readonly [SimpleValueKind] {
  return Array.isArray(kind) && kind.length === 1
}

function isTuple(kind: EventValueKind): kind is SimpleValueKind[] {
  return Array.isArray(kind) && kind.length !== 1
}

function coerceToParameter(data: unknown, kind: EventValueKind): Value {
  if (isArray(kind)) {
    return {
      kind: ValueKind.Array,
      data: (data as unknown[]).map((data) => coerceToParameter(data, kind[0])),
    }
  } else if (isTuple(kind)) {
    const dataTuple = data as unknown[]
    if (dataTuple.length !== kind.length) {
      throw new Error(`tuple ethereum value arity mismatch`)
    }

    return {
      kind: ValueKind.Array,
      data: (data as unknown[]).map((data, i) => coerceToParameter(data, kind[i])),
    }
  } else {
    switch (kind) {
      case ValueKind.Address:
        return { kind, data: coerceAddr(data as Address | string) }
      case ValueKind.FixedBytes:
      case ValueKind.Bytes:
        return { kind, data: coerceBytes(data as Uint8Array | string) }
      case ValueKind.Int:
      case ValueKind.Uint:
        return { kind, data: BigInt(data) }
      default:
        return { kind, data } as Value
    }
  }
}

function newEvent(parameters: EventParam[], meta?: Metadata): Event {
  const m = {
    block: {} as MetadataProperties<Block>,
    transaction: {} as MetadataProperties<Transaction>,
    ...(meta || {}),
  }

  return {
    address: coerceAddr(m.address || ZERO_ADDRESS),
    logIndex: BigInt(m.logIndex || 0),
    transactionLogIndex: BigInt(m.logIndex || 0),
    logType: m.logType || null,
    block: {
      hash: coerceHash(m.block.hash || ZERO_HASH),
      parentHash: coerceHash(m.block.parentHash || ZERO_HASH),
      unclesHash: coerceHash(m.block.unclesHash || ZERO_HASH),
      author: coerceAddr(m.block.author || ZERO_ADDRESS),
      stateRoot: coerceHash(m.block.stateRoot || ZERO_HASH),
      transactionsRoot: coerceHash(m.block.transactionsRoot || ZERO_HASH),
      receiptsRoot: coerceHash(m.block.receiptsRoot || ZERO_HASH),
      number: BigInt(m.block.number || 0),
      gasUsed: BigInt(m.block.gasUsed || 0),
      gasLimit: BigInt(m.block.gasLimit || 0),
      timestamp: BigInt(m.block.timestamp || 0),
      difficulty: BigInt(m.block.difficulty || 0),
      totalDifficulty: BigInt(m.block.totalDifficulty || 0),
      size: m.block.size !== null && m.block.size !== undefined ? BigInt(m.block.size) : null,
    },
    transaction: {
      hash: coerceHash(m.transaction.hash || ZERO_HASH),
      index: BigInt(m.transaction.index || 0),
      from: coerceAddr(m.transaction.from || ZERO_ADDRESS),
      to: coerceAddr(m.transaction.to || m.address || ZERO_ADDRESS),
      value: BigInt(m.transaction.value || 0),
      gasUsed: BigInt(m.transaction.gasUsed || 0),
      gasPrice: BigInt(m.transaction.gasPrice || 0),
      input: coerceBytes(m.transaction.input || EMPTY_INPUT),
    },
    parameters,
  }
}

function coerceAddr(value: Address | string): Address {
  if (typeof value === 'string') {
    return addrToBytes(value)
  } else if (value.length === 20) {
    return value
  } else {
    throw new Error(`invalid address '${value}'`)
  }
}

function coerceBytes(value: Uint8Array | string): Uint8Array {
  return typeof value === 'string' ? fromHex(value) : value
}

function coerceHash(value: Hash | string): Hash {
  if (typeof value === 'string') {
    return hashToBytes(value)
  } else if (value.length === 32) {
    return value
  } else {
    throw new Error(`invalid hash '${value}'`)
  }
}
