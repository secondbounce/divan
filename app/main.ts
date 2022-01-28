import { app } from 'electron';

import { Application } from './application';

let application: Application | undefined;

try {
  app.whenReady()
     .then(() => {
        application = new Application(app);
        application.initialize();
      },
      ((/*reason: any*/) => {
// TODO: log and display error
      }));

} catch (e) {
// TODO: log error and do something
  // Catch Error
  // throw e;
}
