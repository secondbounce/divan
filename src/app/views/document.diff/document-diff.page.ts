import { AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { Change, diffChars, diffLines } from 'diff';
import { forkJoin, Observable } from 'rxjs';

import { convertToText } from '~shared/string';
import { DesignDocument, Document } from '../../core/couchdb';
import { DatabaseCredentials, DocDiffOptions, Logger, ServerCredentials } from '../../core/model';
import { ResultStatus } from '../../enums';
import { ContentSanitizerService, DialogService, DocumentService, LogService, ServerService, ToastService } from '../../services';
import { TabPanelComponent } from '../../tabs';

const ZERO_WIDTH_SPACE: string = '\u200B';
const DIFF_PANEL_GAP: number = 5;

const enum DiffState {
  NoChange = 'no-change',
  Changed = 'changed',
  Missing = 'missing',
  Added = 'added'
}

interface LineDiff {
  source: string;
  sourceState: DiffState;
  target: string;
  targetState: DiffState;
}

// TODO: display progress indicator (for deployment function only?)

@Component({
  selector: 'app-document-diff',
  templateUrl: './document-diff.page.html',
  styleUrls: ['./document-diff.page.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DocumentDiffPage extends TabPanelComponent<DocDiffOptions> implements OnInit, AfterViewChecked {
  public sourceTitle: string = '';
  public targetTitle: string = '';
  public sourceDiffs: SafeHtml | undefined;
  public targetDiffs: SafeHtml | undefined;
  public canCopy: boolean = false;
  @ViewChild('source') private _sourceSection!: ElementRef;
  @ViewChild('target') private _targetSection!: ElementRef;
  @ViewChild('vscroller') private _vscroller!: ElementRef;
  @ViewChild('hscroller') private _hscroller!: ElementRef;
  private _sourceCredentials: DatabaseCredentials | undefined;
  private _targetCredentials: DatabaseCredentials | undefined;
  private _sourceDoc: DesignDocument | undefined;
  private _targetDoc: DesignDocument | undefined;
  private _scrollersHaveBeenSet: boolean = false;
  private readonly _log: Logger;

  constructor(private _serverService: ServerService,
              private _documentService: DocumentService,
              private _contentSanitizerService: ContentSanitizerService,
              private _dialogService: DialogService,
              private _toastService: ToastService,
              logService: LogService) {
    super();
    this._log = logService.getLogger('DocumentDiffPage');
  }

  public ngOnInit(): void {
    if (this.data && this.initializeParams(this.data)) {
      this.run(this.data.sourceDocId, this.data.targetDocId);
    } else {
      this._log.warn('Invalid/missing parameters for document diff', this.data);
      this._toastService.showError('The parameters passed for this diff are missing/invalid.\n\n(See logs for error details.)');
    }
  }

  public ngAfterViewChecked(): void {
    if (!this._scrollersHaveBeenSet) {
      this.configureScrollers();
    }
  }

  @HostListener('wheel', ['$event'])
  public onWheel($event: WheelEvent): void {
    /* Scrolling with the mouse wheel when over anything other than the 'scroller' DIVs won't
      do anything as 'overflow' is hidden.  So we need to explicitly scroll the 'scroller' DIV
      by the corresponding amount.
    */
    const scroller: HTMLDivElement = this._vscroller.nativeElement as HTMLDivElement;
    scroller.scrollBy(0, $event.deltaY);
  }

  public setData(data: DocDiffOptions): void {
    super.setData(data);

    this.sourceTitle = `${data.sourceAlias}/${data.sourceDb}/${data.sourceDocId}`;
    this.targetTitle = `${data.targetAlias}/${data.targetDb}/${data.targetDocId}`;

    const fullTitle: string = `${this.sourceTitle} \u2022 ${this.targetTitle}`;

    if (data.sourceDocId === data.targetDocId) {
      this.setTitle(data.sourceDocId, fullTitle);
    } else {
      this.setTitle(data.sourceDocId + ' \u2022 ' + data.targetDocId, fullTitle);
    }
  }

  private initializeParams(data: DocDiffOptions): boolean {
    const sourceCredentials: ServerCredentials | undefined = this._serverService.getServerCredentials(data.sourceAlias);
    const targetCredentials: ServerCredentials | undefined = this._serverService.getServerCredentials(data.targetAlias);
    let valid: boolean = false;

    if (sourceCredentials && targetCredentials
        && [data.sourceDb, data.sourceDocId, data.targetDb, data.targetDocId].every(value => value.length > 0)) {
      this._sourceCredentials = new DatabaseCredentials(sourceCredentials, data.sourceDb);
      this._targetCredentials = new DatabaseCredentials(targetCredentials, data.targetDb);
      valid = true;
    }

    return valid;
  }

  public run(sourceDocId: string, targetDocId: string): void {
    if (this._sourceCredentials && this._targetCredentials) {
      const sourceDoc$: Observable<Document> = this._documentService.getDocument(this._sourceCredentials, sourceDocId);
      const targetDoc$: Observable<Document> = this._documentService.getDocument(this._targetCredentials, targetDocId);
      forkJoin([sourceDoc$,
                targetDoc$
              ]).subscribe({
                  next: ([sourceDoc, targetDoc]) => {
                    /* We're not currently supporting the comparing/deploying of documents
                      with different ids.  If/when we do, `areContentsDifferent()` will need
                      to take the ids into account (and we'll need to make sure the rest of
                      this code works too, obvs).
                    */
                    this.canCopy = this.areContentsDifferent(sourceDoc, targetDoc);
                    this.performDiff(sourceDoc, targetDoc);
                    this._sourceDoc = sourceDoc as DesignDocument;
                    this._targetDoc = targetDoc as DesignDocument;
                  },
                  error: (error) => {
                    this._log.error('Error retrieving document contents for diff', error);
                    this._toastService.showError('Error retrieving document contents for diff.\n\n(See logs for error details.)');
                  }
                });
    }
  }

  private areContentsDifferent(sourceDoc: Document, targetDoc: Document): boolean {
    const sourceHash: string = this._documentService.getDocumentHashValue(sourceDoc);
    const targetHash: string = this._documentService.getDocumentHashValue(targetDoc);

    return sourceHash !== targetHash;
  }

  private performDiff(sourceDoc: Document, targetDoc: Document): boolean {
    /* IMPORTANT  Using `convertToText()` ensures that all line endings are '\n', so we don't
      need to consider other formats when handling the line endings.
    */
    const sourceContents: string = convertToText(sourceDoc);
    const targetContents: string = convertToText(targetDoc);

    /* diffChars() doesn't consider lines of text, so cannot recognize when a complete
      line has been inserted/removed (and therefore sees the following lines as changed
      too).  So we'll do a line-by-line comparison first and then work out the actual
      differences in each line.

      The options are the optimal way of getting lines matched up, but result in line
      endings being considered in the diffs.  So 'matching' newline characters may end
      up being counted as a separate change to the preceding, non-matching text.  We'll
      need to account for this when processing each line.
    */
    const lineChanges: Change[] = diffLines(sourceContents, targetContents,
                                            {
                                              ignoreWhitespace: false,
                                              newlineIsToken: true
                                            });
    const lineDiffs: LineDiff[] = [];
    let hasDifferences: boolean = false;

    for (let i: number = 0; i < lineChanges.length; i++) {
      const lineChange: Change = lineChanges[i];

      if (lineChange.removed == true || lineChange.added == true) {
        /* If a line has been added or removed, there will be a single Change for that,
          followed by a Change for the next unchanged line.

          If a line is removed from one side and another one added to the other, they'll
          just be seen as a single line that's completely changed.  For changed lines,
          there will be a pair of Changes - a removal followed by an addition - that will
          need to be compared to find the actual change.
        */
        const nextChange: Change = lineChanges[i + 1];

        if (nextChange && (nextChange.removed == true || nextChange.added == true)) {
          /* If our theory about a removal being followed by an addition is correct, this
            should help ensure we're right!
          */
          if (lineChange.removed !== true || nextChange.added !== true) {
            this._log.warn(`Unexpected order of line changes at #${i}`, lineChange);
            this._toastService.showError('Unexpected order of line changes encountered.\n\n(See logs for error details.)');
            return false;
          }

          lineDiffs.push({
            source: lineChange.value,
            sourceState: DiffState.Changed,
            target: nextChange.value,
            targetState: DiffState.Changed
          });

          i++;
        } else {
          /* This change is a single line addition/removal, rather than a changed line.
            However, if it's prefixed with a newline char and the previous change didn't
            end with one, we can safely remove it as it should really be on the previous
            line but would get removed later anyway.
          */
          let missingLine: string = '';
          const previous: LineDiff = lineDiffs[lineDiffs.length - 1];

          if (this.checkMovingLeadingNewLineToPrevious(lineChange, previous)) {
            missingLine = ZERO_WIDTH_SPACE;   /* So the missing line is rendered properly */
          }

          lineDiffs.push({
            source: lineChange.removed == true ? lineChange.value : missingLine,
            sourceState: lineChange.removed == true ? DiffState.Added : DiffState.Missing,
            target: lineChange.added == true ? lineChange.value : missingLine,
            targetState: lineChange.added == true ? DiffState.Added : DiffState.Missing
          });
        }

        hasDifferences = true;
      } else {
        /* Lines match.  However, when we have a changed line where both sides end with the
          same line ending, the newline char will be seen as a separate, 'matching' change.

          If that is then followed by another changed line, the newline char will be the only
          content, so can be suffixed to the previous change (otherwise it'll be interpreted
          as an empty line).

          OTOH, if it's followed by other matching lines, the line endings will be prepended
          to the following 'matching' Change, again causing them to be wrongly interpreted
          as empty lines.  So if the current line diff has no final line ending and the next
          one has a leading one, correct it.
        */
        let ignore: boolean = false;

        if (lineDiffs.length > 0) {
          const previous: LineDiff = lineDiffs[lineDiffs.length - 1];

          if (   lineChange.value === '\n'
              && (!previous.source.endsWith('\n') || !previous.target.endsWith('\n'))) {
            /* We'll update the state too, as it's likely to be relevant content if it's
              an empty line.
            */
            previous.source += '\n';
            previous.sourceState = DiffState.Changed;
            previous.target += '\n';
            previous.targetState = DiffState.Changed;
            ignore = true;
          } else {
            this.checkMovingLeadingNewLineToPrevious(lineChange, previous);
          }
        }

        if (!ignore) {
          lineDiffs.push({
            source: lineChange.value,
            sourceState: DiffState.NoChange,
            target: lineChange.value,
            targetState: DiffState.NoChange
          });
        } else {
          hasDifferences = true;
        }
      }
    }

    const [sourceDiffs, targetDiffs] = this.constructHtmlForLines(lineDiffs);
    this.sourceDiffs = sourceDiffs;
    this.targetDiffs = targetDiffs;

    return hasDifferences;
  }

  private checkMovingLeadingNewLineToPrevious(lineChange: Change, previous: LineDiff): boolean {
    let moved: boolean = false;

    if (   lineChange.value.startsWith('\n')
        && !previous.source.endsWith('\n')
        && !previous.target.endsWith('\n')) {
      /* Adding the newline char to both sides won't affect the state, so that doesn't need updating */
      previous.source += '\n';
      previous.target += '\n';
      lineChange.value = lineChange.value.slice(1);
      moved = true;
    }

    return moved;
  }

  private constructHtmlForLines(lineDiffs: LineDiff[]): [string, string] {
    let sourceDiffs: string = '';
    let targetDiffs: string = '';

    lineDiffs.forEach(lineDiff => {
      this.sortOutTrailingNewLineChars(lineDiff);

      if (lineDiff.sourceState === DiffState.NoChange) {
        lineDiff.source = this._contentSanitizerService.plaintextToHtml(lineDiff.source, true);
        lineDiff.target = this._contentSanitizerService.plaintextToHtml(lineDiff.target, true);
      } else {
        const [sourceDiff, targetDiff] = this.getCharDiffs(lineDiff);
        lineDiff.source = sourceDiff;
        lineDiff.target = targetDiff;
      }

      /* We need a DIV for each change since that will fill the complete panel width
        with its styling (ie. background colour).  But we need a way to identify the
        actual content width so we can size the scrollbar correctly.  So we'll add
        a SPAN around the content that we can measure.
      */
      sourceDiffs += `<div class="${lineDiff.sourceState}"><span>`;
      sourceDiffs += lineDiff.source;
      sourceDiffs += '</span></div>';
      targetDiffs += `<div class="${lineDiff.targetState}"><span>`;
      targetDiffs += lineDiff.target;
      targetDiffs += '</span></div>';
    });

    return [sourceDiffs, targetDiffs];
  }

  private sortOutTrailingNewLineChars(lineDiff: LineDiff): void {
    /* If both sides have content that ends with a new line, we can remove them both as
      they're irrelevant to the HTML.  However if only one side has a line ending, it's
      an important difference as it represents an extra line on one side so needs
      retaining.

      Note that if the line contains nothing but a new line, we'll replace it with a
      zero-width space as that will be used later to identify it as an empty line,
      rather than a missing line.
    */
    if (lineDiff.source.endsWith('\n') && lineDiff.target.endsWith('\n')) {
      /* eslint-disable @typescript-eslint/no-magic-numbers -- length of line ending is fixed */
      if (lineDiff.source.length > 1) {
        lineDiff.source = lineDiff.source.slice(0, -1);
      } else {
        lineDiff.source = ZERO_WIDTH_SPACE;
      }

      if (lineDiff.target.length > 1) {
        lineDiff.target = lineDiff.target.slice(0, -1);
      } else {
        lineDiff.target = ZERO_WIDTH_SPACE;
      }
      /* eslint-enable @typescript-eslint/no-magic-numbers */
    }
  }

  private getCharDiffs(lineDiff: LineDiff): [string, string] {
    let sourceDiff: string = '';
    let targetDiff: string = '';
    const charChanges: Change[] = diffChars(lineDiff.source, lineDiff.target);

    charChanges.forEach(change => {
      const content: string = this._contentSanitizerService.plaintextToHtml(change.value, true);

      /* Each diffLines() change can span multiple lines if they are all the same
        type.  So we need to allow for lines that have been removed from one side
        by adding a dummy line to the other side in order to keep the other changes
        lined up.
      */
      if (change.removed == true) {
        sourceDiff += '<del>';
        sourceDiff += content;
        sourceDiff += '</del>';

        targetDiff += this.addDummyLinesToMatch(change.value);
      } else if (change.added == true) {
        targetDiff += '<ins>';
        targetDiff += content;
        targetDiff += '</ins>';

        sourceDiff += this.addDummyLinesToMatch(change.value);
      } else {
        sourceDiff += content;
        targetDiff += content;
      }
    });

    return [sourceDiff, targetDiff];
  }

  private addDummyLinesToMatch(value: string): string {
    let content: string = '';
    const newlines: string = value.replace(/[^\n]+/g, '');

    if (newlines.length > 0) {
      content = this._contentSanitizerService.plaintextToHtml(newlines, true);
    }

    return content;
  }

  private configureScrollers(): void {
    /* The containers are the two DIVs containing each change's DIV */
    const sourceContainer: HTMLElement | undefined = this._sourceSection.nativeElement.firstElementChild;
    const targetContainer: HTMLElement | undefined = this._targetSection.nativeElement.firstElementChild;

    if (sourceContainer?.hasChildNodes() && targetContainer?.hasChildNodes()) {
      let maxWidth: number = this.getMaxWidthOfChildren(sourceContainer, 0);
      maxWidth = this.getMaxWidthOfChildren(targetContainer, maxWidth);
      maxWidth += DIFF_PANEL_GAP;

      const scrollerChild: HTMLDivElement = this._hscroller.nativeElement.firstElementChild;
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- scroller is twice width of panels
      scrollerChild.style.width = (2 * maxWidth).toString() + 'px';

      let totalHeight: number = this.getTotalHeightOfChildren(sourceContainer);
      totalHeight = Math.max(totalHeight, this.getTotalHeightOfChildren(targetContainer));

      const vertScrollerChild: HTMLDivElement = this._vscroller.nativeElement.firstElementChild;
      vertScrollerChild.style.height = totalHeight.toString() + 'px';

      this._scrollersHaveBeenSet = true;
    }
  }

  private getMaxWidthOfChildren(container: HTMLElement, maxWidth: number): number {
    /* These will contain the changes' DIVs for each document */
    const children: HTMLCollection = container.children;

    /* eslint-disable @typescript-eslint/prefer-for-of -- false positive: HTMLCollections don't have an iterator (at the moment) */
    for (let i: number = 0; i < children.length; i++) {
      const child: Element | null = children[i].firstElementChild;   /* Get the content's SPAN */
      if (child) {
        maxWidth = Math.max(child.scrollWidth, maxWidth);
      }
    }
    /* eslint-enable @typescript-eslint/prefer-for-of */

    return maxWidth;
  }

  private getTotalHeightOfChildren(container: HTMLElement): number {
    /* These will contain the changes' DIVs for each document */
    const children: HTMLCollection = container.children;
    let totalHeight: number = 0;

    /* eslint-disable @typescript-eslint/prefer-for-of -- false positive: HTMLCollections don't have an iterator (at the moment) */
    for (let i: number = 0; i < children.length; i++) {
      const child: Element | null = children[i];
      if (child) {
        totalHeight += child.scrollHeight;
      }
    }
    /* eslint-enable @typescript-eslint/prefer-for-of */

    return totalHeight;
  }

  public updateHorizontalScroll($event: Event): void {
    const scroller: any = $event.currentTarget;

    if (scroller){
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- scroller is twice width of panels
      const position: number = scroller.scrollLeft * 0.5;
      const sourceSection: HTMLElement = this._sourceSection.nativeElement;
      const targetSection: HTMLElement = this._targetSection.nativeElement;

      sourceSection.scrollLeft = position;
      targetSection.scrollLeft = position;
    }
  }

  public updateVerticalScroll($event: Event): void {
    const scroller: any = $event.currentTarget;

    if (scroller) {
      const sourceSection: HTMLElement = this._sourceSection.nativeElement;
      const targetSection: HTMLElement = this._targetSection.nativeElement;

      sourceSection.scrollTop = scroller.scrollTop;
      targetSection.scrollTop = scroller.scrollTop;
    }
  }

  public copyToTarget(): void {
    this.promptToDeployDesignDoc(this._targetCredentials, this._sourceDoc);
  }

  public copyToSource(): void {
    this.promptToDeployDesignDoc(this._sourceCredentials, this._targetDoc);
  }

  private promptToDeployDesignDoc(dbCredentials: DatabaseCredentials | undefined, designDoc: DesignDocument | undefined): void {
    if (dbCredentials && designDoc) {
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
                                  this.run(this.data.sourceDocId, this.data.targetDocId);
                                }
                              }
                            },
                            error: (error) => {
                              this._log.error('An error occurred while copying the design document', error);
                              this._toastService.showError('An error occurred while copying the design document.\n\n(See logs for error details.)');
                            }});
  }
}
