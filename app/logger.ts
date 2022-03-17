import log from 'electron-log';

import { LoggerCore } from './shared/logger-core';

export class Logger extends LoggerCore {
  constructor(name: string) {
    super(log.scope(name));
  }
}
