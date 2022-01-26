import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { DatabaseDiffPage } from './database-diff.page';

const routes: Routes = [
  { path: 'db/:sourceAlias/:sourceDb/:targetAlias/:targetDb', component: DatabaseDiffPage }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ],
  exports: [
    DatabaseDiffPage
  ],
  declarations: [
    DatabaseDiffPage
  ],
  providers: []
})
export class DiffModule {}
