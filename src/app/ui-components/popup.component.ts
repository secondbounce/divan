import { Component, Input } from '@angular/core';
// import { animate, state, style, transition, trigger } from '@angular/animations';

import { ModalComponent } from './modal.component';

@Component({
  selector: 'app-popup',
  template: `
    <span>Popup: {{message}}</span>
    <button (click)="closed.next({ ok: true, data: { foo: 1, bar: 'barbar'} })">&#x2716;</button>
  `,
  // animations: [
  //   trigger('state', [
  //     state('opened', style({ transform: 'translateY(0%)' })),
  //     state('void, closed', style({ transform: 'translateY(100%)', opacity: 0 })),
  //     transition('* => *', animate('100ms ease-in'))
  //   ])
  // ],
  styles: [`
    :host {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: #009cff;
      height: 48px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid black;
      font-size: 24px;
    }

    button {
      border-radius: 50%;
    }
  `]
})
export class PopupComponent extends ModalComponent {
  public static readonly elementTag: string = 'popup-element';
  private _message = '';

  @Input()
  public get message(): string {
    return this._message;
  }
  public set message(message: string) {
    this._message = message;
    // this.state = 'opened';
  }
}
