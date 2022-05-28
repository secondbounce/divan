import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { DatabaseExportPage } from './database-export.page';

export { DatabaseExportPage } from './database-export.page';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule
  ],
  exports: [
    DatabaseExportPage
  ],
  declarations: [
    DatabaseExportPage
  ],
  providers: []
})
export class DatabaseExportModule {}
