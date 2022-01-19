import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { UiComponentsModule } from '../ui-components/ui-components.module';
import { SelectServerComponent } from './select-server.component';
import { ServerListComponent } from './server-list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UiComponentsModule
  ],
  exports: [
    SelectServerComponent,
    ServerListComponent
  ],
  declarations: [
    SelectServerComponent,
    ServerListComponent
  ],
  providers: []
})
export class ServersModule {}
