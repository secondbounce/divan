import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { forkJoin, Observable, takeUntil } from 'rxjs';

import { Database, DESIGN_DOC_ID_PREFIX, DesignDocument } from '../core/couchdb';
import { Logger, LogService } from '../core/logging';
import { DiffOptions, ServerCredentials } from '../core/model';
import { DatabaseDiffOptionsComponent } from '../elements';
import { CompareResult } from '../enums';
import { CouchDbExportService, ModalService, ServerService } from '../services';
import { ModalResult, PageComponent } from '../ui-components';
import { getSha1HashValue, isEqualStringArrays } from '../utility';

interface DocComparisonData {
  docId: string;
  sourceRev: string;
  targetRev: string;
  sourceDoc: DesignDocument | undefined;
  identical: boolean;
}

@Component({
  selector: 'app-database-diff',
  templateUrl: './database-diff.page.html',
  styleUrls: ['./database-diff.page.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DatabaseDiffPage extends PageComponent implements OnInit {
  public diffOptions: DiffOptions = {
    sourceAlias: '',
    sourceDb: '',
    targetAlias: '',
    targetDb: ''
  };
  public source: Database | undefined;
  public target: Database | undefined;
  public designDocData: DocComparisonData[] = [];
  private _sourceCredentials: ServerCredentials | undefined;
  private _targetCredentials: ServerCredentials | undefined;
  private readonly _log: Logger;

  constructor(private _route: ActivatedRoute,
              private _serverService: ServerService,
              private _couchDbExportService: CouchDbExportService,
              private _modalService: ModalService,
              private _location: Location,
              private _router: Router,
              logService: LogService,
              titleService: Title) {
    super(titleService);
    this._log = logService.getLogger('DatabaseDiffPage');
  }

  public ngOnInit(): void {
    super.ngOnInit();

    this._route.paramMap
               .pipe(takeUntil(this.isBeingDestroyed$))
               .subscribe({
                  next: (params: ParamMap) => {
                    this.diffOptions.sourceAlias = params.get('sourceAlias') ?? '';
                    this.diffOptions.sourceDb = params.get('sourceDb') ?? '';
                    this.diffOptions.targetAlias = params.get('targetAlias') ?? '';
                    this.diffOptions.targetDb = params.get('targetDb') ?? '';

                    if (this.validateParams()) {
                      this.run();
                    } else {
// TODO: display error
                      this.showOptions();
                    }
                  },
                  error: (error: any) => {
                    this._log.warn(error);
                  }
                });
  }

  private validateParams(): boolean {
    let valid: boolean = true;

    if (this.diffOptions.sourceAlias.length > 0 && this.diffOptions.targetAlias.length > 0) {
      this._sourceCredentials = this._serverService.getServerCredentials(this.diffOptions.sourceAlias);
      if (typeof(this._sourceCredentials) === 'undefined') {
        this._log.error(`No server registered for '${this.diffOptions.sourceAlias}'`);
        valid = false;
      }

      this._targetCredentials = this._serverService.getServerCredentials(this.diffOptions.targetAlias);
      if (typeof(this._targetCredentials) === 'undefined') {
        this._log.error(`No server registered for '${this.diffOptions.targetAlias}'`);
        valid = false;
      }
    } else {
      valid = false;
    }

    return valid;
  }

  public run(): void {
    if (this._sourceCredentials && this._targetCredentials) {
      const sourceDb: Observable<Database> = this._couchDbExportService.exportDatabase(this._sourceCredentials,
                                                                                       this.diffOptions.sourceDb,
                                                                                       false);
      const targetDb: Observable<Database> = this._couchDbExportService.exportDatabase(this._targetCredentials,
                                                                                       this.diffOptions.targetDb,
                                                                                       false);

      forkJoin([sourceDb,
                targetDb
              ]).subscribe((databases) => {
                  this.source = databases[0];
                  this.target = databases[1];

                  if (this.source._design && this.target._design) {
                    const sourceDesignDocs: DesignDocument[] = Object.values(this.source._design);
                    const targetDesignDocs: DesignDocument[] = Object.values(this.target._design);
                    this.generateDesignDocData(sourceDesignDocs, targetDesignDocs);
                  }
                });
    }
  }

  public showOptions(): void {
    this._modalService.show<DatabaseDiffOptionsComponent>(DatabaseDiffOptionsComponent.elementTag,
                                                          { options: this.diffOptions })
                      .subscribe({
                        next: (result: ModalResult) => {
                          if (result.ok) {
                            this.diffOptions = result.data as DiffOptions;

                            if (this.validateParams()) {
                              this.updateLocation();
                              this.run();
                            }
                          }
                        },
                        error: (error: any) => {
                          this._log.warn(error);
                        }
                      });
  }

  public areEqual(source: string[] | undefined, target: string[] | undefined): boolean {
    return (source && target) ? isEqualStringArrays(source, target)
                              : false;
  }

  public showDocumentDiff(docId: string): void {
    if (docId.length > 0) {
      this._router.navigate(['/diff/doc',
                             this.diffOptions.sourceAlias,
                             this.diffOptions.sourceDb,
                             docId,
                             this.diffOptions.targetAlias,
                             this.diffOptions.targetDb
                            ]);


    }
  }

  private updateLocation(): void {
    const path: string = `/diff/db/${encodeURIComponent(this.diffOptions.sourceAlias)}/${encodeURIComponent(this.diffOptions.sourceDb)}/${encodeURIComponent(this.diffOptions.targetAlias)}/${encodeURIComponent(this.diffOptions.targetDb)}`;
    this._location.replaceState(path);
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
    forkJoin([
      getSha1HashValue(this.getValueForHash(sourceDoc)),
      getSha1HashValue(this.getValueForHash(targetDoc))
    ]).subscribe(hashes => {
        designDocData.push({ docId: this.formatDesignDocId(docId),
                             sourceRev: this.shortenDocRev(sourceDoc?._rev || ''),
                             targetRev: this.shortenDocRev(targetDoc?._rev || ''),
                             sourceDoc,
                             identical: hashes[0] === hashes[1]
                          });
    });
  }

  private getValueForHash(doc: DesignDocument | undefined): string {
    return doc ? JSON.stringify({ ...doc,
                                  _id: undefined,
                                  _rev: undefined
                                })
               : '';
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
}
