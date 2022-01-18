import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { PopupComponent } from './popup.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    PopupComponent
  ],
  declarations: [
    PopupComponent
  ],
  providers: []
})
export class UiComponentsModule {}
