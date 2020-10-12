import { Logger } from './log'
import { Store } from './store'
import { DEFAULT_ETHEREUM } from './chain'

export class Host {
  public readonly log = new Logger()
  public readonly store = new Store()
  public eth = DEFAULT_ETHEREUM

  public abort(message: string | null, fileName: string | null, line: number, column: number): void {
    const m = message || '?'
    const f = fileName || '?'
    const l = line || '?'
    const c = column || '?'
    throw new Error(`aborted "${m}" at ${f}, line ${l}, column ${c}`)
  }
}
