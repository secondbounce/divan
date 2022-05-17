import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { MessageBoxComponent } from './message-box.component';

export * from './message-box.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule
  ],
  exports: [
    MessageBoxComponent
  ],
  declarations: [
    MessageBoxComponent
  ],
  providers: []
})
export class MessageBoxModule {
  public static define(injector: Injector): void {
    const constructor: CustomElementConstructor = createCustomElement(MessageBoxComponent,
                                                                      { injector });
    customElements.define(MessageBoxComponent.elementTag, constructor);
  }
}
