import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DatabaseDiffPage } from './database-diff.page';
import { DocumentDiffPage } from './document-diff.page';

const routes: Routes = [
  { path: 'db/:sourceAlias/:sourceDb/:targetAlias/:targetDb', component: DatabaseDiffPage },
  { path: 'doc/:sourceAlias/:sourceDb/:sourceDocId/:targetAlias/:targetDb/:targetDocId', component: DocumentDiffPage },
  { path: 'doc/:sourceAlias/:sourceDb/:sourceDocId/:targetAlias/:targetDb', component: DocumentDiffPage }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
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
