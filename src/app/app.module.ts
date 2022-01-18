import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LogService } from './core/logging';
import { ServersModule } from './servers/servers.module';
import { CouchDbService, ElectronService, ModalService, ServerService } from './services';
import { UiComponentsModule } from './ui-components/ui-components.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    ServersModule,
    UiComponentsModule
  ],
  providers: [
    CouchDbService,
    ElectronService,
    LogService,
    ModalService,
    ServerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
