import { Injectable } from '@angular/core';
import { GlobalConfig, ToastrService } from 'ngx-toastr';

import { convertToText } from '~shared/string';
import { ContentSanitizerService } from './content-sanitizer.service';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public static readonly globalConfig: Partial<GlobalConfig> = {
    closeButton: true,
    positionClass: 'toast-bottom-right'
  };

  constructor(private _contentSanitizerService: ContentSanitizerService,
              private _toastrService: ToastrService) {}

  public showInfo(message: string): void;
  public showInfo(title: string, message: string): void;
  public showInfo(titleOrMessage: string, optionalMessage?: string): void {
    const [title, message] = this.resolveTitleAndMessage(titleOrMessage, optionalMessage);

    setTimeout(() => this._toastrService.info(message, title, {
                                          enableHtml: true
                                        }));
  }

  public showSuccess(message: string): void;
  public showSuccess(title: string, message: string): void;
  public showSuccess(titleOrMessage: string, optionalMessage?: string): void {
    const [title, message] = this.resolveTitleAndMessage(titleOrMessage, optionalMessage);

    setTimeout(() => this._toastrService.success(message, title, {
                                          enableHtml: true
                                        }));
  }

  public showWarning(message: string): void;
  public showWarning(title: string, message: string): void;
  public showWarning(title: string, error: any): void;
  public showWarning(titleOrMessage: string, messageOrError?: any): void {
    const [title, message] = this.resolveArgs(titleOrMessage, messageOrError);

    setTimeout(() => this._toastrService.warning(message, title, {
                                          enableHtml: true,
                                          disableTimeOut: true,
                                          tapToDismiss: false
                                        }));
  }

  public showError(message: string): void;
  public showError(title: string, message: string): void;
  public showError(title: string, error: any): void;
  public showError(titleOrMessage: string, messageOrError?: any): void {
    const [title, message] = this.resolveArgs(titleOrMessage, messageOrError);

    setTimeout(() => this._toastrService.error(message, title, {
                                          enableHtml: true,
                                          disableTimeOut: true,
                                          tapToDismiss: false
                                        }));
  }

  private resolveTitleAndMessage(titleOrMessage: string, message?: string): [string, string] {
    let title: string = '';

    if (message) {
      title = titleOrMessage;
    } else {
      message = titleOrMessage;
    }

    return [title, message];
  }

  private resolveArgs(titleOrMessage: string, messageOrError?: any): [string, string] {
    let title: string = '';
    let message: string = '';

    if (messageOrError) {
      title = titleOrMessage;

      if (typeof(messageOrError) === 'string') {
        message = messageOrError;
      } else {
        message = convertToText(messageOrError);
      }
    } else {
      message = titleOrMessage;
    }

    message = this._contentSanitizerService.plaintextToHtml(message, true);

    return [title, message];
  }
}
