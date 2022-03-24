import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DatabaseDiffOptionsComponent } from './database-diff-options.component';
import { MessageBoxComponent } from './message-box.component';
import { SelectServerComponent } from './select-server.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DatabaseDiffOptionsComponent,
    MessageBoxComponent,
    SelectServerComponent
  ],
  declarations: [
    DatabaseDiffOptionsComponent,
    MessageBoxComponent,
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

    elementConstructor = createCustomElement(MessageBoxComponent,
                                             { injector });
    customElements.define(MessageBoxComponent.elementTag, elementConstructor);
  }
}
