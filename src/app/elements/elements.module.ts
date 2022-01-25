import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DatabaseDiffOptionsComponent } from './database-diff-options.component';
import { SelectServerComponent } from './select-server.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DatabaseDiffOptionsComponent,
    SelectServerComponent
  ],
  declarations: [
    DatabaseDiffOptionsComponent,
    SelectServerComponent
  ],
  providers: []
})
export class ElementsModule {
  public static define(injector: Injector): void {
    let elementConstructor: CustomElementConstructor = createCustomElement(SelectServerComponent,
                                                                           { injector });
    customElements.define(SelectServerComponent.elementTag, elementConstructor);

    elementConstructor = createCustomElement(DatabaseDiffOptionsComponent,
                                             { injector });
    customElements.define(DatabaseDiffOptionsComponent.elementTag, elementConstructor);
  }
}
