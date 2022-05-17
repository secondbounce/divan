import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { DocumentDiffPage } from './document-diff.page';

export { DocumentDiffPage } from './document-diff.page';

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule
  ],
  exports: [
    DocumentDiffPage
  ],
  declarations: [
    DocumentDiffPage
  ],
  providers: []
})
export class DocumentDiffModule {}
