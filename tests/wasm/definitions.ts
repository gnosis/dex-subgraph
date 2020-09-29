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
} as const

export type EventNames = keyof typeof EventDefinitions
export type EventData<K extends EventNames> = Events.Data<typeof EventDefinitions[K]>
export type EventMetadata = Events.Metadata

export function toEvent<K extends EventNames>(name: K, data: EventData<K>, meta?: EventMetadata): Ethereum.Event {
  return Events.toEvent(EventDefinitions[name], data, meta)
}

const EntityDefinitions = {
  User: {
    id: Store.ValueKind.String,
    fromBatchId: Store.ValueKind.BigInt,
    createEpoch: Store.ValueKind.BigInt,
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
} as const

export type EntityNames = keyof typeof EntityDefinitions
export type EntityData<K extends EntityNames> = Entities.Data<typeof EntityDefinitions[K]>

export function toEntityData<K extends EntityNames>(name: K, entity: Store.Entity): EntityData<K> {
  return Entities.toData(EntityDefinitions[name], entity)
}

export function fromEntityData<K extends EntityNames>(name: K, data: EntityData<K>): Store.Entity {
  return Entities.fromData(EntityDefinitions[name], data)
}
