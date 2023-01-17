import { Injectable } from '@angular/core';
import { FileFilter, SaveDialogSyncOptions } from 'electron';
import { catchError, map, Observable } from 'rxjs';

import { BaseService } from './base.service';
import { ElectronService } from './electron.service';
import { LogService } from './log.service';
import { ModalService } from './modal.service';
import { RendererEvent } from '../enums';
import { MessageBoxComponent, MessageBoxOptions } from '../views/message-box/message-box.module';

@Injectable({
  providedIn: 'root'
})
export class DialogService extends BaseService {
  constructor(private _modalService: ModalService,
              private _electronService: ElectronService,
              logService: LogService) {
    super(logService);
  }

  public showYesNoMessageBox(message: string, title?: string): Observable<boolean> {
    const options: MessageBoxOptions = {
      title: title ?? this._electronService.appName,
      message,
      buttons: [
        {
          label: 'Yes'
        },
        {
          label: 'No'
        }
      ],
      cancelId: 1
    };

    return this._modalService.show<MessageBoxComponent>(MessageBoxComponent.elementTag,
                                                        { options })
                             .pipe(map(result => result.ok),
                                   catchError(err => {
                                    this.log.error('Error displaying MessageBoxComponent', err);
                                    throw err;
                                   }));
  }

  public showSaveDialog(content: string, defaultFilename: string, isJson: boolean): void {
    const filters: FileFilter[] = [
      { name: 'All Files', extensions: ['*'] }
    ];
    const options: SaveDialogSyncOptions = {
      defaultPath: defaultFilename,
      filters,
      properties: ['createDirectory', 'showOverwriteConfirmation']
    };

    if (isJson) {
      filters.unshift({ name: 'JSON', extensions: ['json'] });
    }

    this._electronService.emitRendererEvent(RendererEvent.ShowSaveDialog, content, options);
  }
}
