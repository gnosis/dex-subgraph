import { log } from '@graphprotocol/graph-ts'
import { FleetDeployed as FleetDeployment } from '../../generated/FleetFactory/FleetFactory'
import { FleetDeployed } from '../../generated/schema'
import { toEventId } from '../utils'

import { Address, Bytes } from '@graphprotocol/graph-ts'

export function onFleetDeployment(event: FleetDeployment): void {
  let params = event.params
  log.info('[onFleetDeployment] New FleetDeployment: {}', [event.transaction.hash.toHex()])

  // Create deposit
  let deploymentId = toEventId(event)
  let deployment = new FleetDeployed(deploymentId)
  deployment.owner = params.owner
  deployment.fleet = params.fleet as Array<Bytes>

  // Transaction
  deployment.txHash = event.transaction.hash
  deployment.save()
}
