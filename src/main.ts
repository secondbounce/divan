import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { convertToText } from './app/utility';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, {
                          preserveWhitespaces: false
                        })
                        // eslint-disable-next-line no-console -- if bootstrap fails, just need simplest handler
                        .catch(err => console.error(convertToText(err)));
