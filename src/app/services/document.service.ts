import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AllDocuments, DesignDocument, DocumentHeader } from '../core/couchdb';
import { LogService } from '../core/logging';
import { DatabaseCredentials } from '../core/model';
import { BaseService } from './base.service';
import { CouchDbService } from './couchdb.service';

@Injectable({
  providedIn: 'root'
})
export class DocumentService extends BaseService {
  constructor(private _couchDbService: CouchDbService,
              logService: LogService) {
    super(logService);
  }

  public getDesignDocuments(database: DatabaseCredentials): Observable<DesignDocument[]> {
    return this.getDesignDocuments$(database, true)
               .pipe(map((allDocs: AllDocuments) => {
                  const docs: DesignDocument[] = [];
                  allDocs.rows.map((row: DocumentHeader) => {
                    if (row.doc) {
                      docs.push(row.doc as DesignDocument);
                    }
                  });
                  return docs;
                }));
  }

  private getDesignDocuments$(database: DatabaseCredentials, includeDocs: boolean): Observable<AllDocuments> {
    const [url, headers ] = this.getUrlAndHeaders(database.serverCredentials,
                                                  `/${database.name}/_design_docs`);

    return this._couchDbService.get<AllDocuments>(url, headers,
                                                  {
                                                    include_docs: includeDocs
                                                  });
  }
}
