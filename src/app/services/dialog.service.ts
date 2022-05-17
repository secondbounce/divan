import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

import { MessageBoxComponent, MessageBoxOptions } from '../views/message-box/message-box.module';
import { BaseService } from './base.service';
import { ElectronService } from './electron.service';
import { LogService } from './log.service';
import { ModalService } from './modal.service';

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
}
