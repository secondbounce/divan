import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApplicationRef, DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ToastrModule } from 'ngx-toastr';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LogService } from './core/logging';
import { DiffModule } from './diff/diff.module';
import { ElementsModule } from './elements/elements.module';
import { ServersModule } from './servers/servers.module';
import { ContentSanitizerService,
         CouchDbExportService,
         CouchDbService,
         DialogService,
         DocumentService,
         ElectronService,
         ModalService,
         ServerService,
         ToastService
       } from './services';
import { TabsModule } from './tabs/tabs.module';
import { UiComponentsModule } from './ui-components/ui-components.module';

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
    AppRoutingModule,
    UiComponentsModule,
    ElementsModule,
    TabsModule,
    DiffModule,
    ServersModule
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

    ElementsModule.define(this._injector);
  }
}
