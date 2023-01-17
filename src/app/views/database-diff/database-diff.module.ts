import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { DatabaseDiffPage } from './database-diff.page';
import { DocumentDiffModule } from '../document.diff/document.diff.module';

export { DatabaseDiffPage } from './database-diff.page';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    DocumentDiffModule
  ],
  exports: [
    DatabaseDiffPage
  ],
  declarations: [
    DatabaseDiffPage
  ],
  providers: []
})
export class DatabaseDiffModule {}
