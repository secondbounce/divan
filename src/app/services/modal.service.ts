import { Injectable, Injector } from '@angular/core';
import { createCustomElement, NgElement, WithProperties } from '@angular/elements';
import { first, fromEvent, map, Observable } from 'rxjs';

import { ModalComponent, ModalResult, PopupComponent } from '../ui-components';

@Injectable()
export class ModalService {
  constructor(injector: Injector) {
    const elementConstructor: CustomElementConstructor = createCustomElement(PopupComponent, { injector });
    customElements.define(PopupComponent.elementTag, elementConstructor);
  }

// TODO: save the elementTags when we define them above, so they don't have to be passed here
  public show<ModalType extends ModalComponent>(elementTag: string, properties?: { [key: string]: any }): Observable<ModalResult> {
    const modal: NgElement & WithProperties<ModalType> = document.createElement(elementTag) as any;

    if (properties) {
      const keys: (keyof ModalType)[] = Object.keys(properties) as (keyof WithProperties<ModalType>)[];
      keys.forEach((key) => {
            modal[key] = properties[key.toString()];
          });
    }

    const closed$: Observable<ModalResult> = fromEvent(modal, 'closed').pipe(first(),
                                                                             map(event => {
                                                                              document.body.removeChild(modal);
                                                                              return (event as CustomEvent).detail;
                                                                             }));
    document.body.appendChild(modal);

    return closed$;
  }
}
