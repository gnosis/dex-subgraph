import * as Entities from './runtime/entities'
import * as Store from './runtime/store'

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

export type EntityNames = Entities.Names<typeof EntityDefinitions>
export type EntityData<K extends EntityNames> = Entities.Data<typeof EntityDefinitions, K>

export function toEntityData<K extends EntityNames>(name: K, entity: Store.Entity): EntityData<K> {
  return Entities.toData(EntityDefinitions, name, entity)
}

export function fromEntityData<K extends EntityNames>(name: K, data: EntityData<K>): Store.Entity {
  return Entities.fromData(EntityDefinitions, name, data)
}
