import { Address } from '@graphprotocol/graph-ts'

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

/**
 * List of deprecated tokens. They are renamed to avoid users to get confused with this token, and the newer version
 */
let deprecatedTokens: TokenDetailsByNetwork = {
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

let DEPRECATED_TOKENS = new Map<string, TokenDetails>()
deprecatedTokens.rinkeby.forEach(tokenDetails => {
  DEPRECATED_TOKENS.set(tokenDetails.address.toHex(), tokenDetails)
})

export { DEPRECATED_TOKENS }
