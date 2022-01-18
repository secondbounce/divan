import { convertToText } from '../../utility';

export class Logger {
  constructor(public readonly name: string) {}

/* eslint-disable @typescript-eslint/explicit-module-boundary-types -- we have no idea what object may need to be logged */
/* eslint-disable no-console -- as a temporary stopgap solution, this is all we need/can use */
  public debug(message: string | null | undefined, error?: any): void;
  public debug(error: any): void;
  public debug(messageOrError: any, error?: any): void {
    console.debug(this.getMessage('DEBUG', messageOrError, error));
  }

  public info(message: string | null | undefined, error?: any): void;
  public info(error: any): void;
  public info(messageOrError: any, error?: any): void {
    console.info(this.getMessage('INFO', messageOrError, error));
  }

  public warn(message: string | null | undefined, error?: any): void;
  public warn(error: any): void;
  public warn(messageOrError: any, error?: any): void {
    console.warn(this.getMessage('WARN', messageOrError, error));
  }

  public error(message: string | null | undefined, error?: any): void;
  public error(error: any): void;
  public error(messageOrError: any, error?: any): void {
    console.error(this.getMessage('ERROR', messageOrError, error));
  }

  public fatal(message: string | null | undefined, error?: any): void;
  public fatal(error: any): void;
  public fatal(messageOrError: any, error?: any): void {
    console.error(this.getMessage('FATAL', messageOrError, error));
  }
/* eslint-enable no-console */
/* eslint-enable @typescript-eslint/explicit-module-boundary-types */

  private getMessage(level: string, messageOrError: any, error: any): string {
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

    const logMessage: string = `${level} ${this.name} ${message}${errorMessage}`;
    return logMessage;
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
