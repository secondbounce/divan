import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// TODO: remove this module (for now, it may be useful for testing individual pages)
const routes: Routes = [
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
