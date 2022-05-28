import { Injectable } from '@angular/core';
import { catchError, concatMap, map, Observable, of, zip } from 'rxjs';

import { AllDocuments, DesignDocument, DocResponse, Document, DocumentHeader } from '../core/couchdb';
import { DatabaseCredentials, DocumentDeployment } from '../core/model';
import { ResultStatus } from '../enums';
import { getSha1HashValue } from '../utility';
import { BaseService } from './base.service';
import { CouchDbService } from './couchdb.service';
import { LogService } from './log.service';

// TODO: deployDesignDoc() will fail for partitioned views

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

  public getAllDocuments(database: DatabaseCredentials): Observable<Document[]> {
    return this.getDocuments$(database, true)
               .pipe(map((allDocs: AllDocuments) => {
                      const docs: Document[] = [];
                      allDocs.rows.map(docHeader => {
                                    if (docHeader.doc) {
                                      docs.push(docHeader.doc);
                                    }
                                  });
                      return docs;
                    }));
  }

  private getDocuments$(database: DatabaseCredentials, includeDocs: boolean): Observable<AllDocuments> {
    const [url, headers ] = this.getUrlAndHeaders(database.serverCredentials,
                                                  `/${database.name}/_all_docs`);

    return this._couchDbService.get<AllDocuments>(url, headers,
                                                  {
                                                    include_docs: includeDocs
                                                  });
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

  public deployDesignDoc(target: DatabaseCredentials, newDesignDoc: DesignDocument): Observable<ResultStatus> {
    const documentDeployment: DocumentDeployment = new DocumentDeployment(target, newDesignDoc);

    /* First, get the revision of the document we'll be overwriting (since we must specify it
      when we copy the new version over it).  This will determine how the new doc is copied
      over.
    */
    const targetDocumentUrl: string = documentDeployment.getTargetDocumentUrl();
    return this._couchDbService.getDocInfo(targetDocumentUrl, documentDeployment.headers)
                               .pipe(concatMap(docInfo => {
                                      this.log.debug('deployDesignDoc(#0) => original doc rev obtained');
                                      documentDeployment.originalDocRev = docInfo._rev;
                                      return this.deployOverExistingDesignDoc(documentDeployment);
                                    }),
                                    catchError(err => {
                                      if (this.checkIfNotFound(err)) {
                                        this.log.info(`'${targetDocumentUrl}' does not exist; simple copy will be performed`);
                                        return this.deployToNewDesignDoc(documentDeployment);
                                      } else {
                                        throw err;
                                      }
                                    }));
  }

  private deployToNewDesignDoc(documentDeployment: DocumentDeployment): Observable<ResultStatus> {
    const targetDocumentUrl: string = documentDeployment.getTargetDocumentUrl();
    return this.setUpDocumentCopy(documentDeployment, targetDocumentUrl)
               .pipe(map(result => result ? ResultStatus.Success
                                          : ResultStatus.HardFail));
  }

  private deployOverExistingDesignDoc(documentDeployment: DocumentDeployment): Observable<ResultStatus> {
    /* This process is taken from:
        https://docs.couchdb.org/en/latest/best-practices/views.html#deploying-a-view-change-in-a-live-environment

      Assuming /db/_design/ddoc needs to be updated...

      We have to do this in two phases since we need to get the revisions of any documents we
      want to overwrite/delete later.  So we can't create the observables for those tasks until
      the observables retrieving them have completed.

      1. Copy the old design doc to /db/_design/ddoc-old. The ddoc-old document will reference
      the same view indexes already built for _design/ddoc.
    */
    const targetDocumentUrl: string = documentDeployment.getTargetDocumentUrl();
    const copyOldDoc$: Observable<boolean> = this._couchDbService.copy(targetDocumentUrl,
                                                                       documentDeployment.oldDocId,
                                                                       documentDeployment.headers)
                                                                 .pipe(map(response => {
                                                                        this.log.debug('deployDesignDoc(#1) => old doc backed up');

                                                                        /* This will be the rev of the copy, which will differ from
                                                                          that of the original.  Save it immediately in case other
                                                                          op fails (rev indicates clean-up needed).
                                                                        */
                                                                        documentDeployment.oldDocRev = response.rev;
                                                                        return true;
                                                                      }),
                                                                      catchError(err => {
                                                                        this.log.error('Error backing up original design document', err);
                                                                        return of(false);
                                                                      }));

    /* 2. Upload the updated design doc to /db/_design/ddoc-new.  We need to clear the revision,
      so must clone it too to avoid side-effects in the calling function if it uses the doc
      instance for anything else.
    */
    const newDocumentUrl: string = documentDeployment.getNewDocumentUrl(false);
    const uploadNewDoc$: Observable<boolean> = this.setUpDocumentCopy(documentDeployment, newDocumentUrl);

    return zip(copyOldDoc$,
               uploadNewDoc$
              ).pipe(concatMap(results => {
                      if (results[0] && results[1]) {
                        this.log.debug('deployDesignDoc() => phase 1 complete');
                        return this.deployOverExistingDesignDocPt2(documentDeployment);
                      } else {
                        return this.cleanUpDesignDocTempFiles(documentDeployment)
                                   .pipe(map(() => {
                                          /* Clean-up result is irrelevant; we're only here because
                                            the initial copying failed.
                                          */
                                          return ResultStatus.HardFail;
                                        }));
                      }
                    }));
  }

  private setUpDocumentCopy(documentDeployment: DocumentDeployment, targetUrl: string): Observable<boolean> {
    const docToUpload: DesignDocument = { ...documentDeployment.designDoc,
                                          _rev: undefined
                                        };
    return this._couchDbService.put<DocResponse>(targetUrl,
                                                 documentDeployment.headers,
                                                 docToUpload)
                               .pipe(map(response => {
                                      this.log.debug('deployDesignDoc(#2) => new doc uploaded');

                                      /* Save the new doc's revision immediately in case previous
                                        op fails (rev indicates clean-up needed).
                                      */
                                      documentDeployment.newDocRev = response.rev;
                                      return true;
                                    }),
                                    catchError(err => {
                                      this.log.error('Error uploading new design document', err);
                                      return of(false);
                                    }));
  }

  private deployOverExistingDesignDocPt2(documentDeployment: DocumentDeployment): Observable<ResultStatus> {
    /* 3. Query a view in the new design document to trigger secondary index generation */
// TODO: this will fail for partitioned views
    const firstViewUrl: string = documentDeployment.getFirstViewUrl();
    const queryView$: Observable<boolean> = this._couchDbService.get(firstViewUrl,
                                                                     documentDeployment.headers,
                                                                     { limit: 1 })
                                                                .pipe(map(_doc => {
                                                                        this.log.debug('deployDesignDoc(#3) => new view queried');
                                                                        return true;
                                                                      }),
                                                                      catchError(_err => {
                                                                        /* We don't want the copy to fail just because we can't generate the
                                                                          index - it may be a dodgy view - so just ignore it.
                                                                        */
                                                                        this.log.warn('deployDesignDoc(#3) => querying new view failed');
                                                                        return of(false);
                                                                      }));

    /* 4. When the index is done being built, copy the updated design document to /db/_design/ddoc.
      (The ddoc document will now reference the same view indexes already built for _design/ddoc-new.)
    */
    const newDocumentUrl: string = documentDeployment.getNewDocumentUrl(false);
    const destination: string = documentDeployment.getTargetDocumentIdWithRev();
    const copyNewDoc$: Observable<ResultStatus> = this._couchDbService.copy(newDocumentUrl,
                                                                            destination,
                                                                            documentDeployment.headers)
                                                                      .pipe(map(_response => {
                                                                              this.log.debug('deployDesignDoc(#4) => new doc copied');
                                                                              return ResultStatus.Success;
                                                                            }),
                                                                            catchError(err => {
                                                                              this.log.error('deployDesignDoc(#4) => failed to copy new doc', err);
                                                                              return of(ResultStatus.HardFail);
                                                                            }));

    /* 5b. Trigger Views clean-up to reclaim disk space after deleting ddoc-old */
    const viewCleanUpUrl: string = documentDeployment.getViewCleanUpUrl();
    const cleanUpViews$: Observable<boolean> = this._couchDbService.post<void>(viewCleanUpUrl,
                                                                               documentDeployment.headers)
                                                                   .pipe(map(_response => {
                                                                          this.log.debug('deployDesignDoc(#5b) => view clean-up performed');
                                                                          return true;
                                                                        }),
                                                                        catchError(err => {
                                                                          /* We don't want the copy to fail just because we can't generate the
                                                                            index - it may be a dodgy view - so just ignore it.
                                                                          */
                                                                          this.log.warn('deployDesignDoc(#5b) => view clean-up failed', err);
                                                                          return of(false);
                                                                        }));

    /* These need to be run in series... */
    return queryView$.pipe(concatMap(queried => {
                            documentDeployment.viewQueried = queried;
                            return copyNewDoc$;
                          }),
                          concatMap(resultStatus => {
                            return this.cleanUpDesignDocTempFiles(documentDeployment)
                                       .pipe(map(cleanUpStatus => {
                                              return resultStatus !== ResultStatus.Success ? resultStatus
                                                                                           : cleanUpStatus;
                                            }));
                          }),
                          concatMap(resultStatus => {
                            /* The success of the view clean-up isn't important; the result of
                              copying is.
                            */
                            const cleanUpRequired: boolean = documentDeployment.viewQueried
                                                          || resultStatus !== ResultStatus.HardFail;
                            return cleanUpRequired ? cleanUpViews$.pipe(map(() => resultStatus))
                                                   : of(resultStatus);
                          }));
  }

  private cleanUpDesignDocTempFiles(documentDeployment: DocumentDeployment): Observable<ResultStatus> {
    /* 5a. Delete /db/_design/ddoc-new and /db/_design/ddoc-old */
    let deleteOldDoc$: Observable<boolean>;
    let deleteNewDoc$: Observable<boolean>;

    if (documentDeployment.oldDocRev.length > 0) {
      const oldDocumentUrl: string = documentDeployment.getOldDocumentUrl(true);
      deleteOldDoc$ = this._couchDbService.delete(oldDocumentUrl,
                                                  documentDeployment.headers)
                                          .pipe(map(_response => {
                                                  this.log.debug('deployDesignDoc(#5a) => old copy deleted');
                                                  return true;
                                                }),
                                                catchError(err => {
                                                  this.log.error(`Error deleting old copy ${documentDeployment.oldDocId} for deployDesignDoc(#5)`, err);
                                                  return of(false);
                                                }));
    } else {
      this.log.debug('deployDesignDoc(#5) => old copy not available for deletion');
      deleteOldDoc$ = of(true);
    }

    if (documentDeployment.newDocRev.length > 0) {
      const newDocumentUrl: string = documentDeployment.getNewDocumentUrl(true);
      deleteNewDoc$ = this._couchDbService.delete(newDocumentUrl,
                                                  documentDeployment.headers)
                                          .pipe(map(_response => {
                                                  this.log.debug('deployDesignDoc(#5a) => new copy deleted');
                                                  return true;
                                                }),
                                                catchError(err => {
                                                  this.log.error(`Error deleting new copy ${documentDeployment.newDocId} for deployDesignDoc(#5)`, err);
                                                  return of(false);
                                                }));
    } else {
      this.log.debug('deployDesignDoc(#5) => new copy not available for deletion');
      deleteNewDoc$ = of(true);
    }

    return zip(deleteOldDoc$,
               deleteNewDoc$
              ).pipe(map(results => {
                      this.log.debug('deployDesignDoc(#5) => clean-up completed');
                      return results[0] && results[1] ? ResultStatus.Success : ResultStatus.SoftFail;
                    }));
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
