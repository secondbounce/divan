import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';

import { Database, DESIGN_DOC_ID_PREFIX, DesignDocument } from '../../core/couchdb';
import { DatabaseCredentials, DbDiffOptions, DocDiffOptions, Logger, ServerCredentials } from '../../core/model';
import { CompareResult, ResultStatus } from '../../enums';
import { CouchDbExportService, DialogService, DocumentService, LogService, ModalService, ServerService, TabManagerService, ToastService } from '../../services';
import { TabPanelComponent } from '../../tabs';
import { ModalResult } from '../../ui-components';
import { isEqualStringArrays } from '../../utility';
import { DatabaseDiffOptionsComponent } from '../database-diff-options/database-diff-options.module';
import { DocumentDiffPage } from '../document.diff/document.diff.module';

interface DocComparisonData {
  docId: string;
  label: string;
  sourceDoc?: DesignDocument;
  targetDoc?: DesignDocument;
  sourceRev: string;
  targetRev: string;
  identical: boolean;
  canCompare: boolean;
  canCopyToSource: boolean;
  canCopyToTarget: boolean;
}

@Component({
  selector: 'app-database-diff',
  templateUrl: './database-diff.page.html',
  styleUrls: ['./database-diff.page.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DatabaseDiffPage extends TabPanelComponent<DbDiffOptions> implements OnInit {
  public source: Database | undefined;
  public target: Database | undefined;
  public designDocData: DocComparisonData[] = [];
  private _sourceCredentials: ServerCredentials | undefined;
  private _targetCredentials: ServerCredentials | undefined;
  private readonly _log: Logger;

  constructor(private _serverService: ServerService,
              private _couchDbExportService: CouchDbExportService,
              private _documentService: DocumentService,
              private _modalService: ModalService,
              private _tabManagerService: TabManagerService,
              private _toastService: ToastService,
              private _dialogService: DialogService,
              logService: LogService) {
    super();

    this._log = logService.getLogger('DatabaseDiffPage');
    this.setData({
      sourceAlias: '',
      sourceDb: '',
      targetAlias: '',
      targetDb: ''
    });
  }

  public ngOnInit(): void {
    if (this.validateParams()) {
      this.run();
    } else {
      this.showOptions();
    }
  }

  public setData(data: DbDiffOptions): void {
    super.setData(data);

    const fullTitle: string = `${data.sourceAlias}/${data.sourceDb} \u2022 ${data.targetAlias}/${data.targetDb}`;

    if (data.sourceDb === data.targetDb) {
      this.setTitle(data.sourceDb, fullTitle);
    } else {
      this.setTitle(data.sourceDb + ' \u2022 ' + data.targetDb, fullTitle);
    }
  }

  private validateParams(): boolean {
    let valid: boolean = true;
    let message: string = '';

    if (this.data && this.data.sourceAlias.length > 0 && this.data.targetAlias.length > 0) {
      this._sourceCredentials = this._serverService.getServerCredentials(this.data.sourceAlias);
      if (typeof(this._sourceCredentials) === 'undefined') {
        message = `No server registered for '${this.data.sourceAlias}'`;
        this._log.warn(message);
        valid = false;
      }

      this._targetCredentials = this._serverService.getServerCredentials(this.data.targetAlias);
      if (typeof(this._targetCredentials) === 'undefined') {
        message = `No server registered for '${this.data.targetAlias}'`;
        this._log.warn(message);
        valid = false;
      }

      if (!valid) {
        this._toastService.showWarning(message);
      }
    } else {
      valid = false;
    }

    return valid;
  }

  public run(): void {
    if (this.data && this._sourceCredentials && this._targetCredentials) {
      const sourceDb: Observable<Database> = this._couchDbExportService.exportDatabase(this._sourceCredentials,
                                                                                       this.data.sourceDb,
                                                                                       false);
      const targetDb: Observable<Database> = this._couchDbExportService.exportDatabase(this._targetCredentials,
                                                                                       this.data.targetDb,
                                                                                       false);

      forkJoin([sourceDb,
                targetDb
              ]).subscribe({
                  next: (databases) => {
                    this.source = databases[0];
                    this.target = databases[1];

                    /* The `_design` property will be missing (rather than an empty dictionary)
                      if there are no design documents, so allow for that.
                    */
                    const sourceDesignDocs: DesignDocument[] = Object.values(this.source._design ?? {});
                    const targetDesignDocs: DesignDocument[] = Object.values(this.target._design ?? {});
                    this.generateDesignDocData(sourceDesignDocs, targetDesignDocs);
                  },
                  error: (error) => {
                    this._log.warn(error);
                    this._toastService.showError('Error exporting databases for diff.\n\n(See logs for error details.)');
                  }
                });
    }
  }

  public showOptions(): void {
    this._modalService.show<DatabaseDiffOptionsComponent>(DatabaseDiffOptionsComponent.elementTag,
                                                          { options: this.data })
                      .subscribe({
                        next: (result: ModalResult) => {
                          if (result.ok) {
                            this.setData(result.data as DbDiffOptions);

                            if (this.validateParams()) {
                              this.run();
                            }
                          }
                        },
                        error: (error: any) => {
                          this._log.warn(error);
                          this._toastService.showError('Unable to display Database Diff options dialog.\n\n(See logs for error details.)');
                        }
                      });
  }

  public areEqual(source: string[] | undefined, target: string[] | undefined): boolean {
    return (source && target) ? isEqualStringArrays(source, target)
                              : false;
  }

  public showDocumentDiff(docId: string): void {
    if (this.data && docId.length > 0) {
      const options: DocDiffOptions = {
        sourceAlias: this.data.sourceAlias,
        sourceDb: this.data.sourceDb,
        sourceDocId: docId,
        targetAlias: this.data.targetAlias,
        targetDb: this.data.targetDb,
        targetDocId: docId
      };

      this._tabManagerService.open(DocumentDiffPage, options);
    }
  }

  public copyToSource(docId: string): void {
    if (this.data) {
      const designDoc: DesignDocument | undefined = this.designDocData.find(data => data.docId === docId)?.targetDoc;
      this.promptToDeployDesignDoc(this._sourceCredentials, this.data.sourceDb, designDoc);
    }
  }

  public copyToTarget(docId: string): void {
    if (this.data) {
      const designDoc: DesignDocument | undefined = this.designDocData.find(data => data.docId === docId)?.sourceDoc;
      this.promptToDeployDesignDoc(this._targetCredentials, this.data.targetDb, designDoc);
    }
  }

  private generateDesignDocData(sourceDesignDocs: DesignDocument[], targetDesignDocs: DesignDocument[]): void {
    let sourceIndex: number = 0;
    let targetIndex: number = 0;
    let sourceDoc: DesignDocument | undefined;
    let targetDoc: DesignDocument | undefined;
    let sourceId: string = '';
    let targetId: string = '';
    let result: number = CompareResult.Equal;
    const designDocData: DocComparisonData[] = [];

    /* This does, of course, assume that both arrays are already sorted in alphabetical order */
    while (sourceIndex < sourceDesignDocs.length
        || targetIndex < targetDesignDocs.length) {
      if (sourceIndex < sourceDesignDocs.length) {
        sourceDoc = sourceDesignDocs[sourceIndex];
        sourceId = sourceDoc._id || '';   /* Shouldn't be undefined, but just in case... */
      } else {
        sourceDoc = undefined;
        sourceId = '';
        result = CompareResult.After;
      }

      if (targetIndex < targetDesignDocs.length) {
        targetDoc = targetDesignDocs[targetIndex];
        targetId = targetDoc._id || '';   /* Shouldn't be undefined, but just in case... */
      } else {
        targetDoc = undefined;
        targetId = '';
        result = CompareResult.Before;
      }

      if (sourceDoc && targetDoc) {
        result = sourceId.localeCompare(targetId);
      }

      if (result === CompareResult.Before) {
        this.appendDesignDocData(designDocData, sourceId, sourceDoc);
        sourceIndex++;
      } else if (result === CompareResult.After) {
        this.appendDesignDocData(designDocData, targetId, undefined, targetDoc);
        targetIndex++;
      } else {
        this.appendDesignDocData(designDocData, sourceId, sourceDoc, targetDoc);
        sourceIndex++;
        targetIndex++;
      }
    }

    this.designDocData = designDocData;
  }

  private appendDesignDocData(designDocData: DocComparisonData[],
                              docId: string,
                              sourceDoc?: DesignDocument,
                              targetDoc?: DesignDocument): void {
    /* HACK ALERT!  Although doc revisions are supposed to be an MD5 hash of the doc contents
      (minus the id and rev) - see https://docs.couchdb.org/en/stable/intro/api.html?highlight=hash#revisions
      - and should therefore be the same for docs with identical contents, this isn't always
      the case exactly.  So for comparison purposes, we'll calculate the SHA-1 hash instead.
    */
    const sourceHash: string = this._documentService.getDocumentHashValue(sourceDoc);
    const targetHash: string = this._documentService.getDocumentHashValue(targetDoc);
    const existsInTarget: boolean = typeof(targetDoc) !== 'undefined';
    const existsInSource: boolean = typeof(sourceDoc) !== 'undefined';

    designDocData.push({ docId,
                         label: this.formatDesignDocId(docId),
                         sourceDoc,
                         targetDoc,
                         sourceRev: this.shortenDocRev(sourceDoc?._rev || ''),
                         targetRev: this.shortenDocRev(targetDoc?._rev || ''),
                         identical: sourceHash === targetHash,
                         canCompare: (existsInSource && existsInTarget),
                         canCopyToSource: !existsInSource,
                         canCopyToTarget: !existsInTarget
                      });
  }

  private formatDesignDocId(id: string): string {
    return id.startsWith(DESIGN_DOC_ID_PREFIX) ? id.slice(DESIGN_DOC_ID_PREFIX.length)
                                               : id;
  }

  private shortenDocRev(rev: string | undefined): string {
    /* This accepts both revisions (with the leading version number) and plain hex values */
    return rev ? rev.replace(/^((?:\d+-)?[\da-f]{4})[\da-f]+([\da-f]{4})$/i,
                             ((_match, p1, p2, _offset, _source) => p1 + '...' + p2))
               : '';
  }

  private promptToDeployDesignDoc(serverCredentials: ServerCredentials | undefined,
                                  dbName: string,
                                  designDoc: DesignDocument | undefined): void {
    if (this.data && serverCredentials && designDoc) {
      const dbCredentials: DatabaseCredentials = new DatabaseCredentials(serverCredentials, dbName);
      const target: string = dbCredentials.serverCredentials.alias + '/' + dbCredentials.name;

      this._dialogService.showYesNoMessageBox(`Are you sure you want to copy '${designDoc._id}' to ${target}?`)
                         .subscribe({
                            next: (result) => {
                              if (result) {
                                this.deployDesignDoc(dbCredentials, designDoc);
                              }
                            },
                            error: (_) => {
                              this._toastService.showError('An error occurred displaying the confirmation message box.\n\n(See logs for error details.)');
                            }
                          });
    }
  }

  private deployDesignDoc(dbCredentials: DatabaseCredentials, designDoc: DesignDocument): void {
    this._documentService.deployDesignDoc(dbCredentials, designDoc)
                         .subscribe({
                            next: (resultStatus) => {
                              if (resultStatus === ResultStatus.HardFail) {
                                this._toastService.showError('An error occurred while copying the design document.\n\n(See logs for error details.)');
                              } else {
                                if (resultStatus === ResultStatus.SoftFail) {
                                  this._toastService.showWarning('The design document was copied successfully, but the clean-up failed and may have left temporary documents in the database.\n\n(See logs for error details.)');
                                } else {
                                  this._log.assert(resultStatus === ResultStatus.Success,
                                                   `Unrecognized ResultStatus enum - ${resultStatus}`);
                                }

                                if (this.data) {
                                  this.run();
                                }
                              }
                            },
                            error: (error) => {
                              this._log.error('An error occurred while copying the design document', error);
                              this._toastService.showError('An error occurred while copying the design document.\n\n(See logs for error details.)');
                            }});
  }
}
