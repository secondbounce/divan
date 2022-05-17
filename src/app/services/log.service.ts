import { Injectable } from '@angular/core';
import log from 'electron-log';

import { configureLogging } from '~shared/log-config';
import { Logger } from '../core/model';
import { isElectron } from '../utility';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private _loggers: { [key: string]: Logger } = {};
  private _electronLog: typeof log | undefined;

  constructor() {
    if (isElectron()) {
      /* HACK ALERT!  Can't import 'normally' so this approach is needed (see
        https://github.com/megahertz/electron-log/issues/196#issuecomment-1041015960)
      */
      this._electronLog = window.require('electron-log');

      if (this._electronLog) {
        configureLogging(this._electronLog);
      }
    }
  }

  public getLogger(name: string): Logger {
    let logger: Logger = this._loggers[name];

    if (!logger) {
      logger = new Logger(name, this._electronLog ? this._electronLog.scope(name)
                                                  : console);
      this._loggers[name] = logger;
    }

    return logger;
  }
}
