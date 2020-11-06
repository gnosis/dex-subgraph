import * as Entities from './runtime/entities'
import * as Ethereum from './runtime/ethereum'
import * as Events from './runtime/events'
import * as Store from './runtime/store'

const EventDefinitions = {
  Deposit: {
    user: Ethereum.ValueKind.Address,
    token: Ethereum.ValueKind.Address,
    amount: Ethereum.ValueKind.Uint,
    batchId: Ethereum.ValueKind.Uint,
  },
  OrderCancellation: {
    owner: Ethereum.ValueKind.Address,
    index: Ethereum.ValueKind.Uint,
  },
  OrderDeletion: {
    owner: Ethereum.ValueKind.Address,
    index: Ethereum.ValueKind.Uint,
  },
  OrderPlacement: {
    owner: Ethereum.ValueKind.Address,
    index: Ethereum.ValueKind.Uint,
    buyToken: Ethereum.ValueKind.Uint,
    sellToken: Ethereum.ValueKind.Uint,
    validFrom: Ethereum.ValueKind.Uint,
    validUntil: Ethereum.ValueKind.Uint,
    priceNumerator: Ethereum.ValueKind.Uint,
    priceDenominator: Ethereum.ValueKind.Uint,
  },
  SolutionSubmission: {
    submitter: Ethereum.ValueKind.Address,
    utility: Ethereum.ValueKind.Uint,
    disregardedUtility: Ethereum.ValueKind.Uint,
    burntFees: Ethereum.ValueKind.Uint,
    lastAuctionBurntFees: Ethereum.ValueKind.Uint,
    prices: [Ethereum.ValueKind.Uint],
    tokenIdsForPrice: [Ethereum.ValueKind.Uint],
  },
  TokenListing: {
    token: Ethereum.ValueKind.Address,
    id: Ethereum.ValueKind.Uint,
  },
  Trade: {
    owner: Ethereum.ValueKind.Address,
    orderId: Ethereum.ValueKind.Uint,
    sellToken: Ethereum.ValueKind.Uint,
    buyToken: Ethereum.ValueKind.Uint,
    executedSellAmount: Ethereum.ValueKind.Uint,
    executedBuyAmount: Ethereum.ValueKind.Uint,
  },
  TradeReversion: {
    owner: Ethereum.ValueKind.Address,
    orderId: Ethereum.ValueKind.Uint,
    sellToken: Ethereum.ValueKind.Uint,
    buyToken: Ethereum.ValueKind.Uint,
    executedSellAmount: Ethereum.ValueKind.Uint,
    executedBuyAmount: Ethereum.ValueKind.Uint,
  },
  Withdraw: {
    user: Ethereum.ValueKind.Address,
    token: Ethereum.ValueKind.Address,
    amount: Ethereum.ValueKind.Uint,
  },
  WithdrawRequest: {
    user: Ethereum.ValueKind.Address,
    token: Ethereum.ValueKind.Address,
    amount: Ethereum.ValueKind.Uint,
    batchId: Ethereum.ValueKind.Uint,
  },
} as const

export type EventNames = keyof typeof EventDefinitions
export type EventData<K extends EventNames> = Events.Data<typeof EventDefinitions[K]>
export type EventMetadata = Events.Metadata

export function toEvent<K extends EventNames>(name: K, data: EventData<K>, meta?: EventMetadata): Ethereum.Event {
  return Events.toEvent(EventDefinitions[name], data, meta)
}

const EntityDefinitions = {
  Batch: {
    id: Store.ValueKind.String,
    startEpoch: Store.ValueKind.BigInt,
    endEpoch: Store.ValueKind.BigInt,
    solution: Store.ValueKind.String,
    // missing derived field solutions
    firstSolutionEpoch: Store.ValueKind.BigInt,
    lastRevertEpoch: { optional: Store.ValueKind.BigInt },
    txHash: Store.ValueKind.Bytes,
  },
  Deposit: {
    id: Store.ValueKind.String,
    user: Store.ValueKind.String,
    tokenAddress: Store.ValueKind.Bytes,
    amount: Store.ValueKind.BigInt,
    batchId: Store.ValueKind.BigInt,
    createEpoch: Store.ValueKind.BigInt,
    txHash: Store.ValueKind.Bytes,
  },
  Order: {
    id: Store.ValueKind.String,
    owner: Store.ValueKind.String,
    orderId: Store.ValueKind.Int,
    fromBatchId: Store.ValueKind.BigInt,
    fromEpoch: Store.ValueKind.BigInt,
    untilBatchId: Store.ValueKind.BigInt,
    untilEpoch: Store.ValueKind.BigInt,
    buyToken: Store.ValueKind.String,
    sellToken: Store.ValueKind.String,
    priceNumerator: Store.ValueKind.BigInt,
    priceDenominator: Store.ValueKind.BigInt,
    maxSellAmount: Store.ValueKind.BigInt,
    minReceiveAmount: Store.ValueKind.BigInt,
    soldVolume: Store.ValueKind.BigInt,
    boughtVolume: Store.ValueKind.BigInt,
    createEpoch: Store.ValueKind.BigInt,
    cancelEpoch: { optional: Store.ValueKind.BigInt },
    deleteEpoch: { optional: Store.ValueKind.BigInt },
    txHash: Store.ValueKind.Bytes,
    txLogIndex: Store.ValueKind.BigInt,
  },
  Price: {
    id: Store.ValueKind.String,
    token: Store.ValueKind.String,
    batchId: Store.ValueKind.BigInt,
    priceInOwlNumerator: Store.ValueKind.BigInt,
    priceInOwlDenominator: Store.ValueKind.BigInt,
    volume: Store.ValueKind.BigInt,
    createEpoch: Store.ValueKind.BigInt,
    txHash: Store.ValueKind.Bytes,
  },
  Solution: {
    id: Store.ValueKind.String,
    batch: Store.ValueKind.String,
    solver: { optional: Store.ValueKind.String },
    feeReward: { optional: Store.ValueKind.BigInt },
    objectiveValue: { optional: Store.ValueKind.BigInt },
    trades: [Store.ValueKind.String],
    createEpoch: Store.ValueKind.BigInt,
    revertEpoch: { optional: Store.ValueKind.BigInt },
    txHash: Store.ValueKind.Bytes,
    txLogIndex: Store.ValueKind.BigInt,
  },
  Token: {
    id: Store.ValueKind.String,
    address: Store.ValueKind.Bytes,
    fromBatchId: Store.ValueKind.BigInt,
    symbol: { optional: Store.ValueKind.String },
    decimals: { optional: Store.ValueKind.BigInt },
    name: { optional: Store.ValueKind.String },
    sellVolume: Store.ValueKind.BigInt,
    createEpoch: Store.ValueKind.BigInt,
    txHash: Store.ValueKind.Bytes,
  },
  Trade: {
    id: Store.ValueKind.String,
    order: Store.ValueKind.String,
    owner: Store.ValueKind.String,
    sellVolume: Store.ValueKind.BigInt,
    buyVolume: Store.ValueKind.BigInt,
    tradeBatchId: Store.ValueKind.BigInt,
    tradeEpoch: Store.ValueKind.BigInt,
    buyToken: Store.ValueKind.String,
    sellToken: Store.ValueKind.String,
    createEpoch: Store.ValueKind.BigInt,
    revertEpoch: { optional: Store.ValueKind.BigInt },
    txHash: Store.ValueKind.Bytes,
    txLogIndex: Store.ValueKind.BigInt,
  },
  User: {
    id: Store.ValueKind.String,
    fromBatchId: Store.ValueKind.BigInt,
    createEpoch: Store.ValueKind.BigInt,
    txHash: Store.ValueKind.Bytes,
  },
  Withdraw: {
    id: Store.ValueKind.String,
    user: Store.ValueKind.String,
    tokenAddress: Store.ValueKind.Bytes,
    amount: Store.ValueKind.BigInt,
    createEpoch: Store.ValueKind.BigInt,
    createBatchId: Store.ValueKind.BigInt,
    txHash: Store.ValueKind.Bytes,
  },
  WithdrawRequest: {
    id: Store.ValueKind.String,
    user: Store.ValueKind.String,
    tokenAddress: Store.ValueKind.Bytes,
    amount: Store.ValueKind.BigInt,
    withdrawableFromBatchId: Store.ValueKind.BigInt!,
    createEpoch: Store.ValueKind.BigInt,
    createBatchId: Store.ValueKind.BigInt,
    txHash: Store.ValueKind.Bytes,
  },
} as const

export type EntityNames = keyof typeof EntityDefinitions
export type EntityData<K extends EntityNames> = Entities.Data<typeof EntityDefinitions[K]>

export function toEntityData<K extends EntityNames>(name: K, entity: Store.Entity): EntityData<K> {
  return Entities.toData(EntityDefinitions[name], entity)
}

export function fromEntityData<K extends EntityNames>(name: K, data: EntityData<K>): Store.Entity {
  return Entities.fromData(EntityDefinitions[name], data)
}
