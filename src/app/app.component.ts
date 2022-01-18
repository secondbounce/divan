import { ChangeDetectionStrategy, Component } from '@angular/core';

import { environment } from '../environments/environment';
import { Logger, LogService } from './core/logging';
import { Channel, MenuCommand } from './enums';
import { ElectronService, ModalService } from './services';
import { ModalResult, PopupComponent } from './ui-components';
import { convertToText } from './utility';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class AppComponent {
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
        this._modalService.show<PopupComponent>(PopupComponent.elementTag)
                          .subscribe({
                            next: (result: ModalResult) => {
                              console.log(result);
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
