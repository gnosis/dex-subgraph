# dFusion subgraph

For more information see https://thegraph.com/docs/.

## Setup environment

```bash
# Install dependencies
yarn

# Create your own environment file
cp .env.example .env
```

Edit `.env` and setup your own config

## Update to a new version of the contracts

> First setup environment

```bash
# Install new version of dex-contracts
yarn add @gnosis.pm/dex-contracts@<new-version> --save

# Update ABI
yarn abi
```

Review the differences between the two version in the contract, and adapt all the handlers.
