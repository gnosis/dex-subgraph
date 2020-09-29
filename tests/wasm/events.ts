import { hashToBytes as hash, addrToBytes as addr } from './runtime/convert'
import { Event, EventParam, ValueKind } from './runtime/ethereum'

export const DEFAULT_CONTRACT_ADDRESS = addr('0x0001020304050607080910111213141516171819')

export type Metadata = Partial<{
  logIndex: bigint | number
  blockNumber: bigint | number
  blockTimestamp: bigint | number
  transactionHash: string
  transactionIndex: bigint | number
  from: string
}>

export interface Deposit {
  user: string
  token: string
  amount: bigint
  batchId: number
}

export function deposit(deposit: Deposit, meta?: Metadata): Event {
  return newEvent(
    [
      { name: 'user', value: { kind: ValueKind.Address, data: addr(deposit.user) } },
      { name: 'token', value: { kind: ValueKind.Address, data: addr(deposit.token) } },
      { name: 'amount', value: { kind: ValueKind.Uint, data: deposit.amount } },
      { name: 'batchId', value: { kind: ValueKind.Uint, data: BigInt(deposit.batchId) } },
    ],
    {
      ...{ from: deposit.user },
      ...meta,
    },
  )
}

function newEvent(parameters: EventParam[], meta: Metadata): Event {
  const defaultAddr = new Uint8Array(20).fill(0xff)
  const defaultHash = new Uint8Array(32).fill(0xff)

  const num2hash = (value: bigint) => hash(`0x${value.toString().padStart(64, '0')}`)

  return {
    address: DEFAULT_CONTRACT_ADDRESS,
    logIndex: BigInt(meta.logIndex || 0),
    transactionLogIndex: BigInt(meta.logIndex || 0),
    logType: null,
    block: {
      hash: num2hash(BigInt(meta.blockNumber || 0)),
      parentHash: num2hash(BigInt(meta.blockNumber || 1) - 1n),
      unclesHash: defaultHash,
      author: defaultAddr,
      stateRoot: defaultHash,
      transactionsRoot: defaultHash,
      receiptsRoot: defaultHash,
      number: BigInt(meta.blockNumber || 0),
      gasUsed: 4200000n,
      gasLimit: 13370000n,
      timestamp: BigInt(meta.blockTimestamp || 0),
      difficulty: 42n,
      totalDifficulty: 1337n,
      size: null,
    },
    transaction: {
      hash: meta.transactionHash ? hash(meta.transactionHash) : num2hash(BigInt(meta.transactionIndex || 0)),
      index: BigInt(meta.transactionIndex || 0),
      from: meta.from ? addr(meta.from) : defaultAddr,
      to: DEFAULT_CONTRACT_ADDRESS,
      value: 0n,
      gasUsed: 1000000n,
      gasPrice: 100n * 10n ** 9n,
      input: new Uint8Array(),
    },
    parameters,
  }
}
