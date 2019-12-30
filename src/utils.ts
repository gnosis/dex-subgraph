import { Address, BigInt } from "@graphprotocol/graph-ts";
let BATCH_TIME = BigInt.fromI32(300)

export function toOrderId(ownerAddress: Address, orderId: u32): string {
  return ownerAddress.toHex() + '-' + BigInt.fromI32(orderId).toString();
}

export function batchIdToEpoch(batchId: BigInt): BigInt {
  return batchId.times(BATCH_TIME)
}

export function epochToBatchId(epoch: BigInt): BigInt {
  return epoch.div(BATCH_TIME)
}