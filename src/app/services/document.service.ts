import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AllDocuments, DesignDocument, Document, DocumentHeader } from '../core/couchdb';
import { LogService } from '../core/logging';
import { DatabaseCredentials } from '../core/model';
import { getSha1HashValue } from '../utility';
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

  public getDocument(dbCredentials: DatabaseCredentials, docId: string): Observable<Document> {
    const [url, headers ] = this.getUrlAndHeaders(dbCredentials.serverCredentials, `/${dbCredentials.name}/${docId}`);
    return this._couchDbService.get<Document>(url, headers);
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

  /**
   * Calculates the SHA-1 hash for the contents of a document (ignoring the id and rev).
   *
   * Although doc revisions are supposed to be an MD5 hash of the doc contents (minus the id
   * and rev) - see https://docs.couchdb.org/en/stable/intro/api.html?highlight=hash#revisions
   * - and should therefore be the same for docs with identical contents, this isn't always
   * the case exactly.  So for comparison purposes, it's better to use the SHA-1 hash instead.
   */
  public getDocumentHashValue(doc: Document | undefined): string {
    let hash: string = '';

    if (doc) {
      const contents: string = JSON.stringify({ ...doc,
                                                _id: undefined,
                                                _rev: undefined
                                              });
      hash = getSha1HashValue(contents);
    }

    return hash;
  }
}
