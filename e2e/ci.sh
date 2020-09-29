#!/usr/bin/env bash

set -e

REPO="$(realpath "$(dirname $0)/..")"
COMPOSE_FILE="e2e/docker-compose.yaml"
INDEXING_CHECK_RETRIES=6
INDEXING_CHECK_INTERVAL=5s

docker_compose() {
  docker-compose -f "$COMPOSE_FILE" "$@"
}

on_exit() {
  echo "## Shutting down local Graph node"
  docker_compose logs graph-node
  docker_compose rm --stop -f
}
trap on_exit EXIT

echo "## Running E2E tests from '$REPO'"
cd $REPO

echo "## Starting local Graph node"
docker_compose up -d graph-node

echo "## Deploying Gnosis Protocol to testnet"
docker_compose up dex-contracts

echo "## Deploying subgraph to local Graph node"
yarn create-ganache
yarn deploy

echo "## Waiting for subgraph to index"
for i in $(seq 1 $INDEXING_CHECK_RETRIES); do
  synced=$(
    curl -s \
      -X POST \
      -H 'Content-Type: application/json' \
      -d '{ "query": "{ i: indexingStatusesForSubgraphName(subgraphName: \"gnosis/protocol\") { synced } }" }' \
      http://127.0.0.1:8030/graphql \
    | jq '.data.i[0].synced'
  )
  if [[ "$synced" == "true" ]]; then
    break
  fi
  sleep $INDEXING_CHECK_INTERVAL
done
if [[ "$synced" == "false" ]]; then
  echo "ERROR: Subgraph not indexed in time"
  exit 1
fi

echo "## Running E2E test suite"
yarn test:e2e
