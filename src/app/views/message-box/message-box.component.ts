import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { ContentSanitizerService } from '../../services';
import { ModalComponent } from '../../ui-components';

export interface MessageBoxButton {
  label: string;
  returnValue?: any;
}

export interface MessageBoxOptions {
  title?: string;
  message: string;
  buttons: MessageBoxButton[];
  /**
   * The index of the button to be used to cancel the dialog, via the `Close` button or
   * the `Esc` key.
   */
  cancelId?: number;
}

@Component({
  selector: 'app-message-box',
  templateUrl: './message-box.component.html',
  styleUrls: ['./message-box.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class MessageBoxComponent extends ModalComponent {
  public static readonly elementTag: string = 'message-box-element';
  private _title: string = '';
  private _message: string = '';
  private _options: MessageBoxOptions = {
    message: '',
    buttons: []
  };

  constructor(private _contentSanitizerService: ContentSanitizerService) {
    super();
  }

  public get title(): string {
    return this._title;
  }

  public get message(): string {
    return this._message;
  }

  public get cancelId(): string {
    return this._options.cancelId?.toString() ?? '';
  }

  public get cancelValue(): any {
    return this._cancelValue;
  }

  @Input()
  public get options(): MessageBoxOptions {
    return this._options;
  }
  public set options(options: MessageBoxOptions) {
    this._options = options;
    this.setValuesFromOptions();
  }

  public onClick($event: Event): void {
    const button: HTMLButtonElement = $event.currentTarget as HTMLButtonElement;
    const buttonId: string = button.dataset.buttonId ?? '';
    const returnValue: any = button.value;

    if (buttonId !== this.cancelId) {
      this.ok(returnValue);
    } else {
      this.cancel(returnValue);
    }
  }

  private setValuesFromOptions(): void {
    if (this._options.title && this._options.title.length > 0) {
      this._title = this._options.title;
    }

    this._message = this._contentSanitizerService.plaintextToHtml(this._options.message);

    if (typeof(this._options.cancelId) === 'number') {
      this._cancelValue = this._options.buttons[this._options.cancelId].returnValue;
    }
  }
}
