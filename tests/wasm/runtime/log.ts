import debug from 'debug'

export enum LogLevel {
  Critical = 0,
  Error,
  Warn,
  Info,
  Debug,
}

const LOGGERS = {
  [LogLevel.Critical]: debug('runtime:crit'),
  [LogLevel.Error]: debug('runtime:erro'),
  [LogLevel.Warn]: debug('runtime:warn'),
  [LogLevel.Info]: debug('runtime:info'),
  [LogLevel.Debug]: debug('runtime:dbug'),
}

export class Logger {
  public log(level: LogLevel, message: string): void {
    if (!LOGGERS[level]) {
      throw new Error(`unknown log level ${level} (with message '${message}')`)
    }

    LOGGERS[level](message)
  }
}
