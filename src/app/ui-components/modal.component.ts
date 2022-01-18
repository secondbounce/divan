import { Component, EventEmitter, Output } from '@angular/core';

import { FormComponent } from './form.component';

export interface ModalResult {
  ok: boolean,
  data?: any
}

@Component({
  selector: 'app-modal',
  template: ''
})
export abstract class ModalComponent extends FormComponent {
  // @HostBinding('@state') public state: 'opened' | 'closed' = 'closed';
  @Output() public closed = new EventEmitter<ModalResult>();
}
