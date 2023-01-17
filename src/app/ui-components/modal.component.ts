import { Directive, EventEmitter, HostBinding, HostListener, Output } from '@angular/core';

import { FormComponent } from './form.component';
import { AriaRole } from '../enums';

export interface ModalResult {
  ok: boolean,
  data?: any
}

@Directive()
// eslint-disable-next-line @angular-eslint/directive-class-suffix, -- required for abstract base classes that would otherwise have to be decorated with @Component to avoid NG2007 errors
export abstract class ModalComponent extends FormComponent {
  // @HostBinding('@state') public state: 'opened' | 'closed' = 'closed';
  @Output() public closed = new EventEmitter<ModalResult>();
  @HostBinding('attr.role') public role: AriaRole = AriaRole.Dialog;
// TODO: should default to true if/when open/close methods are implemented (otherwise just remove)
  @HostBinding('attr.aria-hidden') protected _hidden: boolean = false;
  @HostBinding('attr.aria-modal') protected readonly _modal: boolean = true;  /* Never changed, just adds attribute to host element */
  @HostBinding('tabindex') protected readonly _tabindex: number = -1;  /* Never changed, just adds attribute to host element */
  protected _cancelValue: any;

  @HostListener('window:keydown.esc', ['$event'])
  protected onEscKeyDown($event: KeyboardEvent): void {
    if (!this._hidden && this.role !== AriaRole.AlertDialog) {
      $event.preventDefault();
// TODO: should we have show/hide methods too?
      // this.hide();
      this.cancel(this._cancelValue);
    }
  }

  protected ok(data?: any): void {
    this.closed.next({ ok: true, data });
  }

  protected cancel(data?: any): void {
    this.closed.next({ ok: false, data });
  }
}
