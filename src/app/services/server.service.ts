import { HttpHeaders } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { ServerMetaInfo } from '../core/couchdb';
import { LogService } from '../core/logging';
import { Server, ServerCredentials } from '../core/model';
import { BaseService } from './base.service';
import { CouchDbService } from './couchdb.service';

@Injectable({
  providedIn: 'root'
})
export class ServerService extends BaseService implements OnDestroy {
  public availableServers$: ReplaySubject<string[]> = new ReplaySubject<string[]>();
  private readonly _availableServers: Map<string, ServerCredentials> = new Map<string, ServerCredentials>();

  constructor(private _couchDbService: CouchDbService,
              logService: LogService) {
    super(logService);
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.availableServers$.complete();
  }

  public getServerCredentials(serverAliasOrAddress: string): ServerCredentials | undefined {
    let credentials: ServerCredentials | undefined = this._availableServers.get(serverAliasOrAddress);

    if (typeof(credentials) === 'undefined') {
      const url: URL = new URL(serverAliasOrAddress);
      url.pathname = '';
      url.search = '';
      url.username = '';
      url.password = '';
      const address: string = url.toString();

      for (const serverCredentials of this._availableServers.values()) {
        if (serverCredentials.address === address) {
          credentials = serverCredentials;
          break;
        }
      }
    }

    return credentials;
  }

  public getDatabaseUrl(serverAlias: string, database: string): string | undefined {
    let databaseUrl: string | undefined;
    const credentials: ServerCredentials | undefined = this._availableServers.get(serverAlias);

    if (credentials) {
      const url: URL = new URL(credentials.address);
      url.pathname = database;
      databaseUrl = url.toString();
    }

    return databaseUrl;
  }

  public getServer(credentials: ServerCredentials): Observable<Server> {
    const url: URL = new URL(credentials.address);
    url.pathname = '/';
    const metaInfoUrl: string = url.toString();
    const headers: HttpHeaders = this.getAuthorizationHeader(credentials);

    return this._couchDbService.get<ServerMetaInfo>(metaInfoUrl, headers)
                               .pipe(map((metaInfo) => {
                                      this._availableServers.set(credentials.alias, credentials);
                                      this.availableServers$.next(Array.from(this._availableServers.keys())
                                                                       .sort((a, b) => a.toLocaleUpperCase()
                                                                                        .localeCompare(b.toLocaleUpperCase())));
                                      return new Server({
                                        ...credentials,
                                        couchDbVersion: metaInfo.version,
                                        databases: []
                                      });
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
