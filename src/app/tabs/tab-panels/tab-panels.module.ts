import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TabPanelsComponent } from './tab-panels.component';
import { TabPanelsDirective } from './tab-panels.directive';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    TabPanelsComponent
  ],
  declarations: [
    TabPanelsComponent,
    TabPanelsDirective
  ],
  providers: []
})
export class TabPanelsModule {}
