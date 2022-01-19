import { ChangeDetectionStrategy, Component, ViewChild } from '@angular/core';

import { environment } from '../environments/environment';
import { Logger, LogService } from './core/logging';
import { Server } from './core/model';
import { Channel, MenuCommand } from './enums';
import { SelectServerComponent, ServerListComponent } from './servers';
import { ElectronService, ModalService } from './services';
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
              electronService: ElectronService,
              logService: LogService) {
    this._log = logService.getLogger('AppComponent');
    this._log.info('environment:', environment.name);

    electronService.ipcRenderer?.on(Channel.MenuCommand, (_event, message) => this.handleMenuCommand(message));
  }

  public foo(): void {
    this.handleMenuCommand(MenuCommand.OpenServer);
  }

  private handleMenuCommand = (message: any): void => {
    switch (message) {
      case MenuCommand.OpenServer:
        this._modalService.show<SelectServerComponent>(SelectServerComponent.elementTag)
                          .subscribe({
                            next: (result: ModalResult) => {
                              this.serverList.addServer(result.data as Server);
                            },
                            error: (error: any) => {
                              this._log.warn(error);
                            }
                          });
        break;

      default:
        this._log.error(`Unsupported MenuCommand - ${convertToText(message)}`);
        break;
    }
  };
}
