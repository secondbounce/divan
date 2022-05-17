import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { DocumentDiffModule } from '../document.diff/document.diff.module';
import { DatabaseDiffPage } from './database-diff.page';

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
