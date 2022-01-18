import { Injectable } from '@angular/core';
import { Logger } from './logger';

@Injectable()
export class LogService {
  private loggers: { [key: string]: Logger } = {};

  public getLogger(name: string): Logger {
    let logger: Logger = this.loggers[name];

    if (!logger) {
      logger = new Logger(name);
      this.loggers[name] = logger;
    }

    return logger;
  }
}
