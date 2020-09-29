#!/usr/bin/env bash

set -e

npx truffle migrate
yarn truffle-exec scripts/ganache/setup_thegraph_data.ts
