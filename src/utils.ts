import { Address, BigInt } from "@graphprotocol/graph-ts";
let BATCH_TIME = BigInt.fromI32(300)

export function toOrderId(ownerAddress: Address, orderId: u32): string {
  return ownerAddress.toHex() + '-' + BigInt.fromI32(orderId).toString();
}

// TODO: Delete after the type is fixed
export function toOrderIdLegacy(ownerAddress: Address, orderId: BigInt): string {
  return ownerAddress.toHex() + '-' + orderId.toString();
}

export function toTradeId(ownerAddress: Address, orderId: u32, batchId: BigInt): string {
  return ownerAddress.toHex() + '-' + BigInt.fromI32(orderId).toString() + '-' + batchId.toString();
}

export function batchIdToEpoch(batchId: BigInt): BigInt {
  return batchId.times(BATCH_TIME)
}

export function epochToBatchId(epoch: BigInt): BigInt {
  return epoch.div(BATCH_TIME)
}