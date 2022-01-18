import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LogService } from './core/logging';
import { ElectronService, ModalService } from './services';
import { UiComponentsModule } from './ui-components/ui-components.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    UiComponentsModule
  ],
  providers: [
    ElectronService,
    LogService,
    ModalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
