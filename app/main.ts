import { app } from 'electron';

import { Application } from './application';

let application: Application | undefined;
const args: string[] = process.argv.slice(1);
// TODO: think there's a better way (using electron app?) of identifying debug mode than this
const serve: boolean = args.some(val => val === '--serve');

try {
  app.whenReady()
     .then(() => {
        application = new Application(app, serve);
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
