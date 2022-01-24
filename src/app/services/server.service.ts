import { HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ServerMetaInfo } from '../core/couchdb';
import { LogService } from '../core/logging';
import { Server, ServerCredentials } from '../core/model';
import { BaseService } from './base.service';
import { CouchDbService } from './couchdb.service';

@Injectable({
  providedIn: 'root'
})
export class ServerService extends BaseService implements OnDestroy {
  private readonly _servers: Map<string, Server> = new Map<string, Server>();

  constructor(private _couchDbService: CouchDbService,
              logService: LogService) {
    super(logService);
  }

  public getServerCredentials(serverAliasOrAddress: string): ServerCredentials | undefined {
    let server: Server | undefined = this._servers.get(serverAliasOrAddress.toLocaleUpperCase());

    if (typeof(server) === 'undefined') {
      const url: URL = new URL(serverAliasOrAddress);
      url.pathname = '';
      url.search = '';
      url.username = '';
      url.password = '';
      const address: string = url.toString();

      for (const existingServer of this._servers.values()) {
        if (existingServer.address === address) {
          server = existingServer;
          break;
        }
      }
    }

    return new ServerCredentials(server);
  }

  public getDatabaseUrl(serverAlias: string, database: string): string | undefined {
    let databaseUrl: string | undefined;
    const server: Server | undefined = this._servers.get(serverAlias.toLocaleUpperCase());

    if (server) {
      const url: URL = new URL(server.address);
      url.pathname = database;
      databaseUrl = url.toString();
    }

    return databaseUrl;
  }

  public getServer(credentials: ServerCredentials): Observable<Server> {
    /* We're not going to check if the server already exists in the list, as this will effectively
      'refresh' the details, if so.
    */
    const url: URL = new URL(credentials.address);
    url.pathname = '/';
    const metaInfoUrl: string = url.toString();
    const headers: HttpHeaders = this.getAuthorizationHeader(credentials);

    return this._couchDbService.get<ServerMetaInfo>(metaInfoUrl, headers)
                               .pipe(map((metaInfo) => {
                                      const newServer: Server = new Server({
                                        ...credentials,
                                        couchDbVersion: metaInfo.version,
                                        databases: []
                                      });

                                      /* Obviously, this will replace any existing server with the same alias */
                                      this._servers.set(credentials.alias.toLocaleUpperCase(), newServer);

                                      return newServer;
                                    }));
  }

  public getDatabases(credentials: ServerCredentials): Observable<string[]> {
    const url: URL = new URL(credentials.address);
    url.pathname = '/_all_dbs';
    const allDbsUrl: string = url.toString();
    const headers: HttpHeaders = this.getAuthorizationHeader(credentials);

    return this._couchDbService.get<string[]>(allDbsUrl, headers);
  }
}
