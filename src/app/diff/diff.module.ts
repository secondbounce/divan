import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DatabaseDiffPage } from './database-diff.page';
import { DocumentDiffPage } from './document-diff.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
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
