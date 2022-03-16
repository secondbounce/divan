import log from 'electron-log';

import { LoggerCore } from './logger-core';

export class Logger extends LoggerCore {
  constructor(name: string) {
    super(log.scope(name));
  }
}
