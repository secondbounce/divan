import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DatabaseDiffOptionsComponent } from './database-diff-options.component';

export { DatabaseDiffOptionsComponent } from './database-diff-options.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DatabaseDiffOptionsComponent
  ],
  declarations: [
    DatabaseDiffOptionsComponent
  ],
  providers: []
})
export class DatabaseDiffOptionsModule {
  public static define(injector: Injector): void {
    const constructor: CustomElementConstructor = createCustomElement(DatabaseDiffOptionsComponent,
                                                                      { injector });
    customElements.define(DatabaseDiffOptionsComponent.elementTag, constructor);
  }
}
