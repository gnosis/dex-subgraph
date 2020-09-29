export enum ValueKind {
  String = 0,
  Int = 1,
  BigDecimal = 2,
  Bool = 3,
  Array = 4,
  Null = 5,
  Bytes = 6,
  BigInt = 7,
}

export type Value =
  | {
      kind: ValueKind.String
      data: string
    }
  | {
      kind: ValueKind.Int
      data: number
    }
  | {
      kind: ValueKind.BigDecimal
      data: unknown
    }
  | {
      kind: ValueKind.Bool
      data: boolean
    }
  | {
      kind: ValueKind.Array
      data: Value[]
    }
  | {
      kind: ValueKind.Null
      data: null
    }
  | {
      kind: ValueKind.Bytes
      data: Uint8Array
    }
  | {
      kind: ValueKind.BigInt
      data: bigint
    }

export type Entry = {
  name: string
  value: Value
}

export interface Entity {
  entries: Entry[]
}

export class Store {
  private entities = new Map<string, Map<string, Entity>>()

  public get(entity: string, id: string): Entity | null {
    const map = this.entities.get(entity)
    if (!map) {
      return null
    }
    return map.get(id) || null
  }

  public set(entity: string, id: string, data: Entity): void {
    let map = this.entities.get(entity)
    if (!map) {
      map = new Map()
      this.entities.set(entity, map)
    }
    map.set(id, data)
  }
}
