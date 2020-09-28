import { Call, Value } from './ethereum'

export type CallHandler = (call: Call) => Value[] | null

export interface IEthereum {
  call: CallHandler
}

export const DEFAULT_ETHEREUM: IEthereum = {
  call: ({ contractName, functionSignature }: Call) => {
    throw new Error(`unexpected ethereum call ${contractName}.${functionSignature}`)
  },
}
