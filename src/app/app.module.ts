import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApplicationRef, DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app.component';
import {
        ContentSanitizerService,
        CouchDbExportService,
        CouchDbService,
        DialogService,
        DocumentService,
        ElectronService,
        LogService,
        ModalService,
        ServerService,
        TabManagerService,
        ToastService
       } from './services';
import { TabPanelsModule } from './tabs/tab-panels/tab-panels.module';
import { TabstripModule } from './tabs/tabstrip/tabstrip.module';
import { DatabaseDiffOptionsModule } from './views/database-diff-options/database-diff-options.module';
import { DatabaseDiffModule } from './views/database-diff/database-diff.module';
import { DatabaseExportOptionsModule } from './views/database-export-options/database-export-options.module';
import { DatabaseExportModule } from './views/database-export/database-export.module';
import { MessageBoxModule } from './views/message-box/message-box.module';
import { SelectServerModule } from './views/select-server/select-server.module';
import { ServerListModule } from './views/server-list/server-list.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    CommonModule,
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,  // Required for ToastrModule
    ToastrModule.forRoot(ToastService.globalConfig),
    AngularSvgIconModule.forRoot(),
    DatabaseDiffModule,
    DatabaseDiffOptionsModule,
    DatabaseExportModule,
    DatabaseExportOptionsModule,
    MessageBoxModule,
    SelectServerModule,
    ServerListModule,
    TabPanelsModule,
    TabstripModule
  ],
  providers: [
    ContentSanitizerService,
    CouchDbExportService,
    CouchDbService,
    DialogService,
    DocumentService,
    ElectronService,
    LogService,
    ModalService,
    ServerService,
    TabManagerService,
    ToastService
  ],
  bootstrap: [/* See below */]
})
export class AppModule implements DoBootstrap {
  constructor(private _injector: Injector) {}

  public ngDoBootstrap(appRef: ApplicationRef): void {
    /* In order to trigger this event handler so we can initialize the custom elements,
      the `bootstrap` property in the `@NgModule` decorator must be empty.  That therefore
      means that we have to manually bootstrap the app with `AppComponent`.
    */
    appRef.bootstrap(AppComponent);

    DatabaseDiffOptionsModule.define(this._injector);
    DatabaseExportOptionsModule.define(this._injector);
    MessageBoxModule.define(this._injector);
    SelectServerModule.define(this._injector);
  }
}
