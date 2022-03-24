import { Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';

import { LogService } from '../core/logging';
import { MessageBoxComponent, MessageBoxOptions } from '../elements';
import { BaseService } from './base.service';
import { ModalService } from './modal.service';

@Injectable()
export class DialogService extends BaseService {
  constructor(private _modalService: ModalService,
              logService: LogService) {
    super(logService);
  }

  public showYesNoMessageBox(message: string, title?: string): Observable<boolean> {
    const options: MessageBoxOptions = {
      title,
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
