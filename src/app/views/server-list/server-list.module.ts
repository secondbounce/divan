import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { ServerListComponent } from './server-list.component';

export { ServerListComponent } from './server-list.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    ServerListComponent
  ],
  declarations: [
    ServerListComponent
  ],
  providers: []
})
export class ServerListModule {}
