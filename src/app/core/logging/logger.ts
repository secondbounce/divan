import { LoggerCore, LoggerFunctions } from '../../../../app/logger-core';
import { isElectron } from '../../utility';

export class Logger extends LoggerCore {
  private _isElectron: boolean = isElectron();

  constructor(private _name: string,
              log: LoggerFunctions) {
    super(log);
  }

  protected formatMessage(message: string): string {
    return this._isElectron ? message
                            : `[${this._name}] ${message}`;
  }
}
