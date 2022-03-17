import { convertToText } from './string';

/**
 * Common interface supported by both ElectronLog and console, so we can ignore the
 * underlying object being used.
 */
export interface LoggerFunctions {
  error(...params: any[]): void;
  warn(...params: any[]): void;
  info(...params: any[]): void;
  debug(...params: any[]): void;
}

export class LoggerCore {
  constructor(private _log: LoggerFunctions) {}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types -- we have no idea what object may need to be logged */
  public debug(message: string | null | undefined, error?: any): void;
  public debug(error: any): void;
  public debug(messageOrError: any, error?: any): void {
    this._log.debug(this.getMessage(messageOrError, error));
  }

  public info(message: string | null | undefined, error?: any): void;
  public info(error: any): void;
  public info(messageOrError: any, error?: any): void {
    this._log.info(this.getMessage(messageOrError, error));
  }

  public warn(message: string | null | undefined, error?: any): void;
  public warn(error: any): void;
  public warn(messageOrError: any, error?: any): void {
    this._log.warn(this.getMessage(messageOrError, error));
  }

  public error(message: string | null | undefined, error?: any): void;
  public error(error: any): void;
  public error(messageOrError: any, error?: any): void {
    this._log.error(this.getMessage(messageOrError, error));
  }
/* eslint-enable @typescript-eslint/explicit-module-boundary-types */

  /**
   * Override this message to update the message with additional fields/information
   * in scenarios (such as being run in a browser context) where the ElectronLog
   * library is not available.
   */
  protected formatMessage(message: string): string {
    return message;
  }

  private getMessage(messageOrError: any, error: any): string {
    let message: string;
    let errorMessage: string = '';

    if (   typeof(error) === 'undefined'
        && !['string', 'undefined'].includes(typeof(messageOrError))
        && messageOrError !== null) {
      message = '';
      error = messageOrError;
    } else {
      message = this.getSafeMessage(messageOrError);
    }

    if (error) {
      errorMessage = this.renderError(error);
    }

    return this.formatMessage(message + errorMessage);
  }

  private renderError(error: any): string {
    return '\n' + convertToText(error);
  }

  private getSafeMessage(message: string | null | undefined): string {
    if (message === null) {
      message = '[null]';
    } else if (typeof message === 'undefined') {
      message = '[undefined]';
    }

    return message;
  }
}
