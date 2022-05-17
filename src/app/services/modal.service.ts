import { Injectable } from '@angular/core';
import { NgElement, WithProperties } from '@angular/elements';
import { finalize, first, fromEvent, map, Observable } from 'rxjs';

import { RendererEvent } from '../enums';
import { ModalComponent, ModalResult } from '../ui-components';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(private _electronService: ElectronService) {}

// TODO: save the elementTags when we define them, so they don't have to be passed here
  public show<ModalType extends ModalComponent>(elementTag: string,
                                                properties?: { [key: string]: any }): Observable<ModalResult> {
    const modal: NgElement & WithProperties<ModalType> = document.createElement(elementTag) as any;

    if (properties) {
      const keys: (keyof ModalType)[] = Object.keys(properties) as (keyof WithProperties<ModalType>)[];
      keys.forEach((key) => {
            modal[key] = properties[key.toString()];
          });
    }

    const closed$: Observable<ModalResult> = fromEvent(modal, 'closed')
                                                .pipe(first(),
                                                      map(event => {
                                                        document.body.removeChild(modal);
                                                        return (event as CustomEvent).detail;
                                                      }),
                                                      finalize(() => {
                                                        this._electronService.emitRendererEvent(RendererEvent.ModalClosed);
                                                      }));
    document.body.appendChild(modal);
    this._electronService.emitRendererEvent(RendererEvent.ModalOpened);

    return closed$;
  }
}
