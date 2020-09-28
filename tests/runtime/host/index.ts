export class Host {
  public abort(message: string, fileName: string | null, line: number, column: number): void {
    const f = fileName || '?'
    const l = line || '?'
    const c = column || '?'
    throw new Error(`aborted "${message}" at ${f}, line ${l}, column ${c}`)
  }
}
