import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { DatabaseDiffPage } from './database-diff.page';
import { DocumentDiffPage } from './document-diff.page';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule
  ],
  exports: [
    DatabaseDiffPage,
    DocumentDiffPage
  ],
  declarations: [
    DatabaseDiffPage,
    DocumentDiffPage
  ],
  providers: []
})
export class DiffModule {}
