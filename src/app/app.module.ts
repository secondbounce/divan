import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ApplicationRef, DoBootstrap, Injector, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LogService } from './core/logging';
import { ElementsModule } from './elements/elements.module';
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
    UiComponentsModule,
    ServersModule,
    ElementsModule
  ],
  providers: [
    CouchDbService,
    ElectronService,
    LogService,
    ModalService,
    ServerService
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
