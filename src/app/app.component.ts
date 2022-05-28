import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { convertToText } from '~shared/string';
import { environment } from '../environments/environment';
import { DbDiffOptions, DbExportOptions, Logger, Server, ServerCredentials } from './core/model';
import { Channel, MenuCommand, RendererEvent } from './enums';
import { ElectronService, LogService, ModalService, TabManagerService, ToastService } from './services';
import { ModalResult } from './ui-components';
import { DatabaseDiffOptionsComponent } from './views/database-diff-options/database-diff-options.module';
import { DatabaseDiffPage } from './views/database-diff/database-diff.module';
import { DatabaseExportPage } from './views/database-export/database-export.module';
import { SelectServerComponent } from './views/select-server/select-server.module';
import { ServerListComponent } from './views/server-list/server-list.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent {
  @ViewChild(ServerListComponent) public serverList!: ServerListComponent;
  private readonly _log: Logger;

  constructor(private _modalService: ModalService,
              private _electronService: ElectronService,
              private _tabManagerService: TabManagerService,
              private _toastService: ToastService,
              logService: LogService) {
    this._log = logService.getLogger('AppComponent');
    this._log.info('environment: ' + environment.name);

    _electronService.on(Channel.MenuCommand, (...args) => this.handleMenuCommand(...args));
  }

  private handleMenuCommand = (...args: any[]): void => {
    const menuCommand: MenuCommand = args[0];

    switch (menuCommand) {
      case MenuCommand.OpenServer: {
        const [, credentials] = args;
        this.openServer(credentials);
        break;
      }
      case MenuCommand.DiffDatabases: {
        const [, serverAlias, database] = args;
        this.diffDatabases(serverAlias, database);
        break;
      }
      case MenuCommand.ExportDatabase: {
        const [, serverAlias, database] = args;
        this.exportDatabase(serverAlias, database);
        break;
      }
      default:
        this._log.error(`Unsupported MenuCommand - ${convertToText(menuCommand)}`);
        break;
    }
  };

  private openServer(credentials: ServerCredentials | undefined): void {
    this._modalService.show<SelectServerComponent>(SelectServerComponent.elementTag,
                                                   { credentials })
                      .subscribe({
                        next: (result: ModalResult) => {
                          if (result.ok) {
                            const server: Server = result.data as Server;
                            this.serverList.addServer(server);

                            credentials = new ServerCredentials({
                              alias: server.alias,
                              address: server.address,
                              username: server.username,
                              password: ''  /* Don't save password (it's stored in plaintext for starters) */
                            });
                            this._electronService.emitRendererEvent(RendererEvent.ServerOpened, credentials);
                          }
                        },
                        error: (error: any) => {
                          this._log.warn(error);
                          this._toastService.showError('Unable to display Select Server dialog.\n\n(See logs for error details.)');
                        }
                      });
  }

  private diffDatabases(serverAlias: string | undefined, database: string | undefined): void {
    let options: DbDiffOptions = {
      sourceAlias: serverAlias ?? '',
      sourceDb: database ?? '',
      targetAlias: '',
      targetDb: ''
    };

    this._modalService.show<DatabaseDiffOptionsComponent>(DatabaseDiffOptionsComponent.elementTag,
                                                          { options })
                      .subscribe({
                        next: (result: ModalResult) => {
                          if (result.ok) {
                            options = result.data as DbDiffOptions;
                            this._tabManagerService.open(DatabaseDiffPage, options);
                          }
                        },
                        error: (error: any) => {
                          this._log.warn(error);
                          this._toastService.showError('Unable to display Database Diff options dialog.\n\n(See logs for error details.)');
                        }
                      });
  }

  private exportDatabase(serverAlias: string, database: string): void {
    const options: DbExportOptions = {
      serverAlias,
      dbName: database,
      includeDocs: false,
      includeRevs: false,
      exportAsJson: true
    };

    this._tabManagerService.open(DatabaseExportPage, options);
  }
}
