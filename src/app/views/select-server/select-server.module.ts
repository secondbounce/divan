import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SelectServerComponent } from './select-server.component';

export { SelectServerComponent } from './select-server.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    SelectServerComponent
  ],
  declarations: [
    SelectServerComponent
  ],
  providers: []
})
export class SelectServerModule {
  public static define(injector: Injector): void {
    const constructor: CustomElementConstructor = createCustomElement(SelectServerComponent,
                                                                      { injector });
    customElements.define(SelectServerComponent.elementTag, constructor);
  }
}
