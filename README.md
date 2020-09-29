# Gnosis Protocol subgraph

<img align="right" width="350" src="./docs/subgraph.png">

Implements a subgraph for the [Gnosis Protocol](https://github.com/gnosis/dex-contracts)

- [Subgraph on Mainnet](https://thegraph.com/explorer/subgraph/gnosis/protocol)
- [Subgraph on Rinkeby](https://thegraph.com/explorer/subgraph/gnosis/protocol-rinkeby)
- [Subgraph on xDAI](https://thegraph.com/explorer/subgraph/gnosis/protocol-xdai)

For more information about:

- The Gnosis Protocol: https://docs.gnosis.io/protocol
- The graph: https://thegraph.com/docs

---

## Setup for Local Development

In order to hack on the subgraph locally, first install the necessary project dependencies with Yarn:

```bash
yarn
```

### Unit Tests

This repository contains a mock Graph runtime implementation in order to be able to test mapping handlers. These tests can be run with `yarn` once the mappings have been built.

```bash
yarn build
yarn test
```

### Integration Tests

Addionally, integration tests with an actual local Graph node are also available for this subgraph. In order to facilitate things, a Docker compose configuration is provided:
```bash
cd e2e

# First start the local Graph node
docker-compose up -d graph-node

# Deploy the Gnosis Protocol contracts
docker-compose up dex-contracts

# Create a new subgraph
yarn create:ganache

# Deploy it
yarn deploy:ganache
```

The subgraph should be accessible in: <http://127.0.0.1:8000/subgraphs/name/gnosis/protocol/graphql>

<details><summary>Example of GraphQL query to try:</summary>

```graphql
query UserData {
  users {
    id

    orders {
      id
      orderId
      owner {
        id
      }
      buyToken {
        id
        address
        name
        symbol
      }
      sellToken {
        id
        address
        name
        symbol
      }
      txHash
      txLogIndex
    }

    deposits {
      id
      tokenAddress
      amount
      txHash
    }

    withdrawals {
      tokenAddress
      txHash
    }

    withdrawRequests {
      tokenAddress
      txHash
    }
  }
}
```

</details>

Note that after modifications to the subgraph, simply re-deploying the subgraph is enough:

```bash
vim schema.graphql
vim subgraph.yaml.mustache
vim src/mappings/*.ts

# Redeploy the subgraph
yarn deploy:ganache
```

## Update to a new version of the contracts

> First setup for local development (see above)

1. Make sure you use the latest version of `dex-contracts`

```bash
# See all available versions in: https://www.npmjs.com/package/@gnosis.pm/dex-contracts
npm ls @gnosis.pm/dex-contracts
```

2. Update the ABI

```bash
# Install new version of dex-contracts
yarn add @gnosis.pm/dex-contracts@<new-version> --save

# Update ABI
yarn abi
```

3. Make sure the addresses are updated

```bash
# Show the addresses for all the networks
yarn addresses

# Update the addresses and the start block
vim config/ganache.json
vim config/rinkeby.json
vim config/xdai.json
vim config/mainnet.json
```

4. Review the differences between the two version in the contract, and adapt all the handlers.

5. Regenerate the model:

```bash
yarn codegen
```

## Deploy to rinkeby or mainnet

> First update the version of dex-contracts if it's not up to date

Deploy to the different networks:

```bash
# Make sure you are authenticated
graph auth https://api.thegraph.com/deploy/ <your-access-token>

# Deploy to rinkeby
yarn deploy:rinkeby

# Deploy to xdai
yarn deploy:xdai

# Deploy to staging
yarn deploy:staging

# Deploy to mainnet
# IMPORTANT: Make sure the graph is well tested in staging environment
yarn deploy:mainnet
```

## Troubleshooting

```bash
# Delete all containers and images
docker-compose down

# Run the Graph and re-deploy Gnosis Protocol
docker-compose up -d graph-node
docker-compose up dex-contracts
```
