import { addrToBytes, fromHex, hashToBytes } from './convert'
import { Address, Block, Event, EventParam, Hash, Transaction, Value, ValueKind } from './ethereum'

export type MetadataProperties<T> = {
  [K in keyof T]?: T[K] extends Address | Hash
    ? string
    : T[K] extends Address | null
    ? string | null
    : T[K] extends bigint
    ? bigint | number
    : T[K] extends (infer S)[]
    ? MetadataProperties<S>[]
    : // eslint-disable-next-line @typescript-eslint/ban-types
    T[K] extends object
    ? MetadataProperties<T[K]>
    : T[K]
}

export type Metadata = MetadataProperties<Omit<Event, 'parameters'>>

export type RecursiveValueKind =
  | Exclude<ValueKind, ValueKind.FixedArray | ValueKind.Array | ValueKind.Array>
  | readonly [RecursiveValueKind]
  | RecursiveValueKind[]
export type Definition = Record<string, RecursiveValueKind>

type RawValueOf<T> = Extract<Value, { kind: T }>['data']
export type ValueOf<T> = T extends readonly [infer S]
  ? ValueOf<S>[]
  : T extends RecursiveValueKind[]
  ? unknown[]
  : RawValueOf<T> extends Value[]
  ? never
  : RawValueOf<T> extends Uint8Array
  ? string
  : RawValueOf<T> extends bigint
  ? bigint | number
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

function isArray(kind: RecursiveValueKind): kind is readonly [RecursiveValueKind] {
  return Array.isArray(kind) && kind.length === 1
}

function isTuple(kind: RecursiveValueKind): kind is RecursiveValueKind[] {
  return Array.isArray(kind) && kind.length !== 1
}

function coerceToParameter(data: unknown, kind: RecursiveValueKind): Value {
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
        return { kind, data: addrToBytes(data as string) }
      case ValueKind.FixedBytes:
      case ValueKind.Bytes:
        return { kind, data: fromHex(data as string) }
      case ValueKind.Int:
      case ValueKind.Uint:
        return { kind, data: BigInt(data) }
      default:
        return { kind, data } as Value
    }
  }
}

function newEvent(parameters: EventParam[], meta?: Metadata): Event {
  const defaultAddr = `0x${'ff'.repeat(20)}`
  const defaultHash = `0x${'ff'.repeat(32)}`
  const m = {
    block: {} as MetadataProperties<Block>,
    transaction: {} as MetadataProperties<Transaction>,
    ...(meta || {}),
  }

  return {
    address: addrToBytes(m.address || defaultAddr),
    logIndex: BigInt(m.logIndex || 0),
    transactionLogIndex: BigInt(m.logIndex || 0),
    logType: m.logType || null,
    block: {
      hash: hashToBytes(m.block.hash || defaultHash),
      parentHash: hashToBytes(m.block.parentHash || defaultHash),
      unclesHash: hashToBytes(m.block.unclesHash || defaultHash),
      author: addrToBytes(m.block.author || defaultAddr),
      stateRoot: hashToBytes(m.block.stateRoot || defaultHash),
      transactionsRoot: hashToBytes(m.block.transactionsRoot || defaultHash),
      receiptsRoot: hashToBytes(m.block.receiptsRoot || defaultHash),
      number: BigInt(m.block.number || 0),
      gasUsed: BigInt(m.block.gasUsed || 0),
      gasLimit: BigInt(m.block.gasLimit || 0),
      timestamp: BigInt(m.block.timestamp || 0),
      difficulty: BigInt(m.block.difficulty || 0),
      totalDifficulty: BigInt(m.block.totalDifficulty || 0),
      size: m.block.size !== null ? BigInt(m.block.size || 0) : null,
    },
    transaction: {
      hash: hashToBytes(m.transaction.hash || defaultHash),
      index: BigInt(m.transaction.index || 0),
      from: addrToBytes(m.transaction.from || defaultAddr),
      to: addrToBytes(m.transaction.to || m.address || defaultAddr),
      value: BigInt(m.transaction.value || 0),
      gasUsed: BigInt(m.transaction.gasUsed || 0),
      gasPrice: BigInt(m.transaction.gasPrice || 0),
      input: fromHex(m.transaction.input || '0x'),
    },
    parameters,
  }
}
