import { CommonModule } from '@angular/common';
import { Injector, NgModule } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DatabaseExportOptionsComponent } from './database-export-options.component';

export { DatabaseExportOptionsComponent } from './database-export-options.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    DatabaseExportOptionsComponent
  ],
  declarations: [
    DatabaseExportOptionsComponent
  ],
  providers: []
})
export class DatabaseExportOptionsModule {
  public static define(injector: Injector): void {
    const constructor: CustomElementConstructor = createCustomElement(DatabaseExportOptionsComponent,
                                                                      { injector });
    customElements.define(DatabaseExportOptionsComponent.elementTag, constructor);
  }
}
