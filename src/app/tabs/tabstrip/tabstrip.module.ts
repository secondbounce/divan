import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { TabstripComponent } from './tabstrip.component';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule
  ],
  exports: [
    TabstripComponent
  ],
  declarations: [
    TabstripComponent
  ],
  providers: []
})
export class TabstripModule {}
