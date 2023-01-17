import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

import { convertToText, stringify } from '~shared/string';
import { DbExportOptions, Logger, ServerCredentials } from 'src/app/core/model';
import { ContentSanitizerService, CouchDbExportService, DialogService, LogService, ModalService, ServerService, ToastService } from 'src/app/services';
import { ModalResult } from 'src/app/ui-components';
import { TabPanelComponent } from '../../tabs';
import { DatabaseExportOptionsComponent } from '../database-export-options/database-export-options.module';

@Component({
  selector: 'app-database-export',
  templateUrl: './database-export.page.html',
  styleUrls: ['./database-export.page.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class DatabaseExportPage extends TabPanelComponent<DbExportOptions> implements OnInit {
  public dbContent: string = '';
  private _credentials: ServerCredentials | undefined;
  private _exportContent: string = '';
  private readonly _log: Logger;

  constructor(private _serverService: ServerService,
              private _couchDbExportService: CouchDbExportService,
              private _contentSanitizerService: ContentSanitizerService,
              private _modalService: ModalService,
              private _toastService: ToastService,
              private _dialogService: DialogService,
              logService: LogService) {
    super();

    this._log = logService.getLogger('DatabaseExportPage');
    this.setData({
      serverAlias: '',
      dbName: '',
      includeDocs: false,
      includeRevs: false,
      exportAsJson: true
    });
  }

  public ngOnInit(): void {
    if (this.validateParams()) {
      this.run();
    } else {
      this.showOptions();
    }
  }

  public setData(data: DbExportOptions): void {
    super.setData(data);

    const fullTitle: string = `${data.serverAlias}/${data.dbName}`;
    this.setTitle(data.dbName, fullTitle);
  }

  private validateParams(): boolean {
    let valid: boolean = false;

    if (this.data && this.data.serverAlias.length > 0) {
      this._credentials = this._serverService.getServerCredentials(this.data.serverAlias);
      if (this._credentials) {
        valid = true;
      } else {
        const message: string = `No server registered for '${this.data.serverAlias}'`;
        this._log.warn(message);
        this._toastService.showWarning(message);
      }
    }

    return valid;
  }

  public run(): void {
    if (this.data && this._credentials) {
      this._couchDbExportService.exportDatabase(this._credentials,
                                                this.data.dbName,
                                                this.data.includeDocs,
                                                this.data.includeRevs)
                                .subscribe({
                                  next: (database) => {
                                    this._exportContent = this.data?.exportAsJson ? stringify(database)
                                                                                  : convertToText(database);
                                    this.dbContent = this._contentSanitizerService.plaintextToHtml(this._exportContent, true);
                                  },
                                  error: (error) => {
                                    this._log.warn(error);
                                    this._toastService.showError('Error exporting database.\n\n(See logs for error details.)');
                                  }
                                });
    }
  }

  public showOptions(): void {
    this._modalService.show<DatabaseExportOptionsComponent>(DatabaseExportOptionsComponent.elementTag,
                                                            { options: this.data })
                      .subscribe({
                        next: (result: ModalResult) => {
                          if (result.ok) {
                            this.setData(result.data as DbExportOptions);

                            if (this.validateParams()) {
                              this.run();
                            }
                          }
                        },
                        error: (error: any) => {
                          this._log.warn(error);
                          this._toastService.showError('Unable to display Database Export options dialog.\n\n(See logs for error details.)');
                        }
                      });
  }

  public saveToFile(): void {
    if (this.data) {
      this._dialogService.showSaveDialog(this._exportContent, this.data.dbName, this.data.exportAsJson);
    }
  }
}
