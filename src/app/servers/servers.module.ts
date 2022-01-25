import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ServerListComponent } from './server-list.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    ServerListComponent
  ],
  declarations: [
    ServerListComponent
  ],
  providers: []
})
export class ServersModule {}
