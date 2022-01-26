import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Database, DbInfo, DESIGN_DOC_ID_PREFIX, DesignDocument, Document, Security } from '../core/couchdb';
import { LogService } from '../core/logging';
import { DatabaseCredentials, ServerCredentials } from '../core/model';
import { BaseService } from './base.service';
import { CouchDbService } from './couchdb.service';
import { DocumentService } from './document.service';

// TODO: rename to something clearer
const enum ValuesIndex {
  /* eslint-disable @typescript-eslint/no-shadow */
  DbInfo,
  Security,
  DesignDocuments,
  Documents   // Must be last as it's optional
  /* eslint-enable @typescript-eslint/no-shadow */
}

@Injectable()
export class CouchDbExportService extends BaseService {
  constructor(private _documentService: DocumentService,
              private _couchDbService: CouchDbService,
              logService: LogService) {
    super(logService);
  }

  public exportDatabase(credentials: ServerCredentials, dbName: string, _includeDocs: boolean): Observable<Database> {
    const serverUrl: URL = new URL(credentials.address);
    const headers: HttpHeaders = this.getAuthorizationHeader(credentials);
    const dbCredentials: DatabaseCredentials = new DatabaseCredentials(credentials, dbName);

    const dbInfo$: Observable<DbInfo> = this.getDbInfo(serverUrl, dbName, headers);
    const security$: Observable<Security> = this.getSecurity(serverUrl, dbName, headers);
    const designDocuments$: Observable<DesignDocument[]> = this._documentService.getDesignDocuments(dbCredentials);
    const queries$: (Observable<DbInfo> | Observable<Document[]> | Observable<Security>)[] = [
      dbInfo$,
      security$,
      designDocuments$
    ];

    // if (includeDocs) {
// TODO: add required queries
    // }

    return forkJoin(queries$).pipe(map((values: (DbInfo | Security | Document[] | DesignDocument[])[]) => {
                                    const dbInfo: DbInfo = values[ValuesIndex.DbInfo] as DbInfo;
                                    const security: Security = values[ValuesIndex.Security] as Security;
                                    const database: Database = {
                                      name: dbInfo.db_name,
                                      partitioned: dbInfo.props?.partitioned || false,
                                      _security: security
                                    };

                                    // if (includeDocs) {
// TODO: add non-design docs to the database object
                                    // }

                                    const designDocs: DesignDocument[] = values[ValuesIndex.DesignDocuments] as DesignDocument[];
                                    const _design: { [key: string]: DesignDocument } = {};

                                    designDocs.forEach((designDocument: DesignDocument) => {
                                      if (designDocument._id !== DESIGN_DOC_ID_PREFIX + '_auth') {
                                        const id: string = designDocument._id || '';
                                        const name: string = id.replace('^' + DESIGN_DOC_ID_PREFIX, '');
                                        _design[name] = designDocument;
                                      }
                                    });

                                    if (Object.keys(_design).length > 0) {
                                      database._design = _design;
                                    }

                                    return database;
                                  }));
  }

  private getDbInfo(serverUrl: URL, dbName: string, headers: HttpHeaders): Observable<DbInfo> {
    serverUrl.pathname = `/${dbName}`;
    return this._couchDbService.get<DbInfo>(serverUrl.toString(), headers);
  }

  private getSecurity(serverUrl: URL, dbName: string, headers: HttpHeaders): Observable<Security> {
    serverUrl.pathname = `/${dbName}/_security`;
    return this._couchDbService.get<Security>(serverUrl.toString(), headers);
  }
}
