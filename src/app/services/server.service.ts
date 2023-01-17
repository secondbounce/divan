import { HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { map, Observable, ReplaySubject } from 'rxjs';

import { BaseService } from './base.service';
import { CouchDbService } from './couchdb.service';
import { LogService } from './log.service';
import { ServerMetaInfo } from '../core/couchdb';
import { Server, ServerCredentials } from '../core/model';
import { getAuthorizationHeader } from '../utility';

@Injectable({
  providedIn: 'root'
})
export class ServerService extends BaseService implements OnDestroy {
  public serverAliases$: ReplaySubject<string[]> = new ReplaySubject<string[]>();
  private readonly _servers: Map<string, Server> = new Map<string, Server>();

  constructor(private _couchDbService: CouchDbService,
              logService: LogService) {
    super(logService);
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.serverAliases$.complete();
  }

  public getServerCredentials(serverAliasOrAddress: string): ServerCredentials | undefined {
    let credentials: ServerCredentials | undefined;
    const server: Server | undefined = this._servers.get(serverAliasOrAddress.toLocaleUpperCase());

    if (server) {
      credentials = new ServerCredentials(server);
    } else {
      try {
        const url: URL = new URL(serverAliasOrAddress);
        url.pathname = '';
        url.search = '';
        url.username = '';
        url.password = '';
        const address: string = url.toString();

        for (const existingServer of this._servers.values()) {
          if (existingServer.address === address) {
            credentials = new ServerCredentials(existingServer);
            break;
          }
        }
      } catch {
        /* Probably just an incorrect alias, so not a valid URL */
      }
    }

    return credentials;
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
    const headers: HttpHeaders = getAuthorizationHeader(credentials);

    return this._couchDbService.get<ServerMetaInfo>(metaInfoUrl, headers)
                               .pipe(map((metaInfo) => {
                                      const newServer: Server = new Server({
                                        ...credentials,
                                        couchDbVersion: metaInfo.version,
                                        databases: []
                                      });

                                      /* Obviously, this will replace any existing server with the same alias */
                                      this._servers.set(credentials.alias.toLocaleUpperCase(), newServer);

                                      /* We can't use _servers.keys() since they're converted to uppercase... */
                                      this.serverAliases$.next(Array.from(this._servers.values())
                                                                    .map(server => server.alias)
                                                                    .sort((a, b) => a.toLocaleUpperCase()
                                                                                     .localeCompare(b.toLocaleUpperCase())));

                                      return newServer;
                                    }));
  }

  public getDatabases(credentials: ServerCredentials): Observable<string[]> {
    const url: URL = new URL(credentials.address);
    url.pathname = '/_all_dbs';
    const allDbsUrl: string = url.toString();
    const headers: HttpHeaders = getAuthorizationHeader(credentials);

    return this._couchDbService.get<string[]>(allDbsUrl, headers);
  }
}
