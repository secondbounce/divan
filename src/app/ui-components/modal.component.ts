import { Directive, EventEmitter, Output } from '@angular/core';

import { FormComponent } from './form.component';

export interface ModalResult {
  ok: boolean,
  data?: any
}

@Directive()
// eslint-disable-next-line @angular-eslint/directive-class-suffix, -- required for abstract base classes that would otherwise have to be decorated with @Component to avoid NG2007 errors
export abstract class ModalComponent extends FormComponent {
  // @HostBinding('@state') public state: 'opened' | 'closed' = 'closed';
  @Output() public closed = new EventEmitter<ModalResult>();

  protected ok(data?: any): void {
    this.closed.next({ ok: true, data });
  }

  protected cancel(): void {
    this.closed.next({ ok: false });
  }
}
