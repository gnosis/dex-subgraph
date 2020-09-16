export enum LogLevel {
  Critical = 0,
  Error,
  Warn,
  Info,
  Debug,
}

export class Logger {
  public log(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.Critical:
        console.error(message)
        throw new Error(message)
      case LogLevel.Error:
        console.error(message)
        break
      case LogLevel.Warn:
        console.warn(message)
        break
      case LogLevel.Info:
        console.info(message)
        break
      case LogLevel.Debug:
        console.debug(message)
        break
      default:
        throw new Error(`unknown log level ${level} (with message '${message}')`)
    }
  }
}
