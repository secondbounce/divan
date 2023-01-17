import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseService } from './base.service';
import { CouchDbService } from './couchdb.service';
import { DocumentService } from './document.service';
import { LogService } from './log.service';
import { Database, DbInfo, DESIGN_DOC_ID_PREFIX, DesignDocument, Document, Security } from '../core/couchdb';
import { DatabaseCredentials, ServerCredentials } from '../core/model';
import { getAuthorizationHeader } from '../utility';

const enum ExportQueriesIndex {
  /* eslint-disable @typescript-eslint/no-shadow */
  DbInfo,
  Security,
  Documents
  /* eslint-enable @typescript-eslint/no-shadow */
}

@Injectable({
  providedIn: 'root'
})
export class CouchDbExportService extends BaseService {
  private readonly _designDocIdRegex: RegExp = new RegExp('^' + DESIGN_DOC_ID_PREFIX);

  constructor(private _documentService: DocumentService,
              private _couchDbService: CouchDbService,
              logService: LogService) {
    super(logService);
  }

  public exportDatabase(credentials: ServerCredentials, dbName: string, includeDocs: boolean, includeRevs: boolean): Observable<Database> {
    const serverUrl: URL = new URL(credentials.address);
    const headers: HttpHeaders = getAuthorizationHeader(credentials);
    const dbCredentials: DatabaseCredentials = new DatabaseCredentials(credentials, dbName);

    const dbInfo$: Observable<DbInfo> = this.getDbInfo(serverUrl, dbName, headers);
    const security$: Observable<Security> = this.getSecurity(serverUrl, dbName, headers);
    const queries$: (Observable<DbInfo> | Observable<Document[]> | Observable<Security>)[] = [
      dbInfo$,
      security$
    ];

    if (includeDocs) {
      const documents$: Observable<Document[]> = this._documentService.getAllDocuments(dbCredentials);
      queries$.push(documents$);
    } else {
      const designDocuments$: Observable<DesignDocument[]> = this._documentService.getDesignDocuments(dbCredentials);
      queries$.push(designDocuments$);
    }

    return forkJoin(queries$).pipe(map((values: (DbInfo | Security | Document[] | DesignDocument[])[]) => {
                                    const dbInfo: DbInfo = values[ExportQueriesIndex.DbInfo] as DbInfo;
                                    const security: Security = values[ExportQueriesIndex.Security] as Security;
                                    const database: Database = {
                                      name: dbInfo.db_name,
                                      partitioned: dbInfo.props?.partitioned || false,
                                      _security: security
                                    };

                                    if (includeDocs) {
                                      const documents: Document[] = values[ExportQueriesIndex.Documents] as Document[];
                                      this.appendAllDocs(database, documents, includeRevs);
                                    } else {
                                      const designDocs: DesignDocument[] = values[ExportQueriesIndex.Documents] as DesignDocument[];
                                      this.appendDesignDocs(database, designDocs, includeRevs);
                                    }

                                    return database;
                                  }));
  }

  private appendAllDocs(database: Database, documents: Document[], includeRevs: boolean): void {
    const _design: { [key: string]: DesignDocument } = {};

    documents.forEach((document: Document) => {
      if (!includeRevs) {
        delete document._rev;
      }

      if (document._id?.startsWith(DESIGN_DOC_ID_PREFIX)) {
        const designDocument: DesignDocument = document as DesignDocument;
        this.appendDesignDoc(_design, designDocument);
      } else {
        database[document._id ?? ''] = document;
      }
    });

    if (Object.keys(_design).length > 0) {
      database._design = _design;
    }
  }

  private appendDesignDocs(database: Database, designDocs: DesignDocument[], includeRevs: boolean): void {
    const _design: { [key: string]: DesignDocument } = {};

    designDocs.forEach((designDocument: DesignDocument) => {
      if (!includeRevs) {
        delete designDocument._rev;
      }

      this.appendDesignDoc(_design, designDocument);
    });

    if (Object.keys(_design).length > 0) {
      database._design = _design;
    }
  }

  private appendDesignDoc(_design: { [key: string]: DesignDocument }, designDoc: DesignDocument): void {
    if (designDoc._id !== DESIGN_DOC_ID_PREFIX + '_auth') {
      const id: string = designDoc._id || '';
      const name: string = id.replace(this._designDocIdRegex, '');
      _design[name] = designDoc;
    }
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
