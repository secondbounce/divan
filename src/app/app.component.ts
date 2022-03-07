import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { environment } from '../environments/environment';
import { Logger, LogService } from './core/logging';
import { DiffOptions, Server, ServerCredentials } from './core/model';
import { DatabaseDiffPage } from './diff';
import { DatabaseDiffOptionsComponent, SelectServerComponent } from './elements';
import { Channel, MenuCommand, RendererEvent } from './enums';
import { ServerListComponent } from './servers';
import { ElectronService, ModalService, TabManagerService } from './services';
import { TabPanel } from './tabs/tab-panel';
import { ModalResult } from './ui-components';
import { convertToText } from './utility';

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
              logService: LogService) {
    this._log = logService.getLogger('AppComponent');
    this._log.info('environment:', environment.name);

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
// TODO: if all properties (inc. password) are set, how about just opening it, without displaying modal?
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
                        }
                      });
  }

  private diffDatabases(): void {
    this._modalService.show<DatabaseDiffOptionsComponent>(DatabaseDiffOptionsComponent.elementTag)
                      .subscribe({
                        next: (result: ModalResult) => {
                          if (result.ok) {
                            const options: DiffOptions = result.data as DiffOptions;
                            const tabPanel: TabPanel = new TabPanel(DatabaseDiffPage, options);
                            this._tabManagerService.open(tabPanel);
                          }
                        },
                        error: (error: any) => {
                          this._log.warn(error);
                        }
                      });
  }
}
