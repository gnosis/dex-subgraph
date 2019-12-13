# dFusion subgraph

For more information see https://thegraph.com/docs/.

## Update to a new version of the contracts

```bash
# Install new version of dex-contracts
yarn add @gnosis.pm/dex-contracts@<new-version> --save

# Update ABI
yarn abi
```

Review the differences between the two version in the contract, and adapt all the handlers.
