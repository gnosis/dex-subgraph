import { Address, dataSource, log } from '@graphprotocol/graph-ts'
export class TokenDetails {
  name: string
  symbol: string
  address: Address
}

class TokenDetailsByNetwork {
  mainnet: TokenDetails[]
  rinkeby: TokenDetails[]
  ganache: TokenDetails[]
}

// FIXME: Find a nicer solution. I cannot load from JSON ('./config/ganache.json')
const GANACHE_NETWORK = '0x9561C133DD8580860B6b7E504bC5Aa500f0f06a7'
const RINKEBY_NETWORK = '0xC576eA7bd102F7E476368a5E98FA455d1Ea34dE2'
/**
 * List of deprecated tokens. They are renamed to avoid users to get confused with this token, and the newer version
 */
let deprecatedTokensByNetwork: TokenDetailsByNetwork = {
  mainnet: [
    {
      name: 'Synth sUSD (deprecated)',
      symbol: 'sUSD-old',
      address: Address.fromString('0x57Ab1E02fEE23774580C119740129eAC7081e9D3'),
    },
    {
      name: 'Synthetix Network Token (deprecated)',
      symbol: 'SNX-old',
      address: Address.fromString('0xC011A72400E58ecD99Ee497CF89E3775d4bd732F'),
    },
  ],
  rinkeby: [
    {
      name: 'Synth sUSD (deprecated)',
      symbol: 'sUSD-old',
      address: Address.fromString('0x1b642a124cdfa1e5835276a6ddaa6cfc4b35d52c'),
    },
  ],
  ganache: [
    {
      name: 'Test Token (deprecated)',
      symbol: 'TEST-old',
      address: Address.fromString('0x254dffcd3277c0b1660f6d42efbb754edababc2b'),
    },
  ],
}

let contractAddress = dataSource.address()

let deprecatedTokens: TokenDetails[] = []
let NETWORK = 'mainnet'
if (contractAddress.equals(Address.fromString(GANACHE_NETWORK))) {
  NETWORK = 'ganache'
  deprecatedTokens = deprecatedTokensByNetwork.ganache
} else if (contractAddress.equals(Address.fromString(RINKEBY_NETWORK))) {
  NETWORK = 'rinkeby'
  deprecatedTokens = deprecatedTokensByNetwork.rinkeby
} else {
  deprecatedTokens = deprecatedTokensByNetwork.mainnet
}
log.info('[config] Network "{}". BatchExchange Contract: {}', [NETWORK, GANACHE_NETWORK, contractAddress.toHex()])

let DEPRECATED_TOKENS = new Map<string, TokenDetails>()
deprecatedTokens.forEach(tokenDetails => {
  DEPRECATED_TOKENS.set(tokenDetails.address.toHex(), tokenDetails)
})

export { NETWORK, DEPRECATED_TOKENS }
