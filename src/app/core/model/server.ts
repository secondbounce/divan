import { ServerCredentials } from './server-credentials';

export class Server extends ServerCredentials {
  public couchDbVersion: string = '';
  public readonly databases: Array<string> = new Array<string>();

  constructor(server?: Server) {
    super(server);

    if (server) {
      this.couchDbVersion = server.couchDbVersion;
      this.databases.push(...server.databases);
    }
  }
}
