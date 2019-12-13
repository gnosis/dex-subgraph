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

## Setup for local development

> First setup environment

1. Run a local ganache and migrate the dependencies
   > TODO: Initially this step was done in the same project, but there's a dependency issue to solve in dex-contracts. It's better for now cloning dex-contracts and migrating separatelly

```bash
# Run a local ganache (requires you to have it globally installed)
ganache-cli -h 0.0.0.0

# Migrate dependencies
yarn migrate

# Setup 3 testing account and tokens
yarn setup

# Check the deployed addresses
npx truffle networks
```

2. Create a new file `config/ganache.json` using [ganache.example.json](.config/ganache.example.json) as an example. Fill the address for the contracts deployed in ganache:

```bash
# Create ganche conf
cp config/ganache.example.json config/ganache.json

# Add the addresses
vim config/ganache.json
```

3. Run a local The Graph Node

```bash
# Clone The Graph node
git clone https://github.com/graphprotocol/graph-node/
cd graph-node/docker

# Run it
docker-compose up
```

4. Create a local subgraph:

```bash
# Create a new subgraph
yarn create-local

# Deploy it
yarn deploy-local
```

The subgraph should be accesible in: http://127.0.0.1:8000/subgraphs/name/anxolin/dfusion/graphql

## Local development: Deposit, claim, place orders

> First setup for local development

```bash
# place order
npx truffle exec scripts/stablex/place_order.js --accountId=0 --buyToken=1 --sellToken=0 --minBuy=999 --maxSell=2000 --validFor=20

# Deposit
npx truffle exec scripts/stablex/deposit.js --accountId=0 --tokenId=0 --amount=3000

# Wait 300s
npx truffle exec scripts/wait_seconds.js 300

# Claim
npx truffle exec scripts/stablex/claim_withdraw.js --tokenId 0xc778417e063141139fce010982780140aa0cd5ab
```

## Update to a new version of the contracts

> First setup for local development

1. Update the ABI

```bash
# Install new version of dex-contracts
yarn add @gnosis.pm/dex-contracts@<new-version> --save

# Update ABI
yarn abi
```

2. Review the differences between the two version in the contract, and adapt all the handlers.

3. Regenerate the model:

```bash
yarn codegen
```
