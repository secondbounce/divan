import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UiComponentsModule } from '../ui-components/ui-components.module';
import { SelectServerComponent } from './select-server.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UiComponentsModule
  ],
  exports: [
    SelectServerComponent
  ],
  declarations: [
    SelectServerComponent
  ],
  providers: []
})
export class ServersModule {}
