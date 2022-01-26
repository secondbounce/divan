import { ServerCredentials } from './server-credentials';

export class DatabaseCredentials {
  public readonly serverCredentials: ServerCredentials;

  constructor(serverCredentials: ServerCredentials,
              public name: string) {
    this.serverCredentials = new ServerCredentials(serverCredentials);  /* Clone it */
  }
}
