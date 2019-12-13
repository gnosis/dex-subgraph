import { OrderPlacement as OrderPlacementEvent } from '../generated/BatchExchange/BatchExchange'
import { OrderPlacement } from '../generated/schema'

export function handleOrderPlacement(event: OrderPlacementEvent): void {
  // const id = event.params.id.toHex()
  // let id = event.params.owner + '_' + event.params.index
  let orderPlacement = new OrderPlacement(event.params.index.toHex())
  orderPlacement.owner = event.params.owner
  orderPlacement.index = event.params.index
  orderPlacement.buyToken = event.params.buyToken
  orderPlacement.sellToken = event.params.sellToken
  orderPlacement.priceNumerator = event.params.priceNumerator
  orderPlacement.priceDenominator = event.params.priceDenominator
  orderPlacement.validFrom = event.params.validFrom
  orderPlacement.validUntil = event.params.validUntil

  orderPlacement.save()
}
