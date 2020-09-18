import { Logger } from './log'
import { Store } from './store'

export class Host {
  public readonly log = new Logger()
  public readonly store = new Store()

  public abort(message: string, fileName: string | null, line: number, column: number): void {
    const f = fileName || '?'
    const l = line || '?'
    const c = column || '?'
    throw new Error(`aborted "${message}" at ${f}, line ${l}, column ${c}`)
  }
}
