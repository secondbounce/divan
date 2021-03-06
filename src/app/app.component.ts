import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { convertToText } from '~shared/string';
import { environment } from '../environments/environment';
import { DbDiffOptions, Logger, Server, ServerCredentials } from './core/model';
import { Channel, MenuCommand, RendererEvent } from './enums';
import { ElectronService, LogService, ModalService, TabManagerService, ToastService } from './services';
import { ModalResult } from './ui-components';
import { DatabaseDiffOptionsComponent } from './views/database-diff-options/database-diff-options.module';
import { DatabaseDiffPage } from './views/database-diff/database-diff.module';
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
        const credentials: ServerCredentials | undefined = args.length > 1 ? args[1] : undefined;
        this.openServer(credentials);
        break;
      }
      case MenuCommand.DiffDatabases:
        this.diffDatabases();
        break;

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

  private diffDatabases(): void {
    this._modalService.show<DatabaseDiffOptionsComponent>(DatabaseDiffOptionsComponent.elementTag)
                      .subscribe({
                        next: (result: ModalResult) => {
                          if (result.ok) {
                            const options: DbDiffOptions = result.data as DbDiffOptions;
                            this._tabManagerService.open(DatabaseDiffPage, options);
                          }
                        },
                        error: (error: any) => {
                          this._log.warn(error);
                          this._toastService.showError('Unable to display Database Diff options dialog.\n\n(See logs for error details.)');
                        }
                      });
  }
}
