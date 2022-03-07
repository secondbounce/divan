import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { TabPanelsComponent } from './tab-panels.component';
import { TabPanelsDirective } from './tab-panels.directive';
import { TabstripComponent } from './tabstrip.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [
    TabPanelsComponent,
    TabPanelsDirective,
    TabstripComponent
  ],
  declarations: [
    TabPanelsComponent,
    TabPanelsDirective,
    TabstripComponent
  ],
  providers: []
})
export class TabsModule {}
