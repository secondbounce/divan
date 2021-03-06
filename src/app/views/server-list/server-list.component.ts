import { ChangeDetectionStrategy, Component } from '@angular/core';

import { Logger, Server } from '../../core/model';
import { LogService, ServerService, ToastService } from '../../services';

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.html',
  styleUrls: ['./server-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ServerListComponent {
  public readonly servers: Server[] = [];
  private readonly _log: Logger;

  constructor(private _serverService: ServerService,
              private _toastService: ToastService,
              logService: LogService) {
    this._log = logService.getLogger('AppComponent');
  }

  public addServer(server: Server): void {
    this.servers.push(server);
  }

  public onTogglingDatabases($event: Event, server: Server): void {
    const details: HTMLDetailsElement = $event.currentTarget as HTMLDetailsElement;

    if (server.databases.length === 0 && details.open) {
      this._serverService.getDatabases(server)
                         .subscribe({
                            next: (databases: string[]) => {
                              server.databases.push(...databases);
                            },
                            error: (error: any) => {
                              this._log.error(`Unable to get databases for ${server.address}`, error);
                              this._toastService.showError(`Unable to get databases for ${server.address}\n\n(See logs for error details.)`);
                            }
                          });
    }
  }
}
