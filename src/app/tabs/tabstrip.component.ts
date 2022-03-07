import { Component, HostListener } from '@angular/core';
import { Observable } from 'rxjs';

import { TabManagerService } from '../services';
import { TabItem } from './tab-item';

const SCROLL_FACTOR: number = 0.5;

// TODO: make sure that any newly-added tabs are scrolled into view

@Component({
  selector: 'app-tabstrip',
  templateUrl: './tabstrip.component.html',
  styleUrls: ['./tabstrip.component.scss']
})
export class TabstripComponent {
  public tabItems$: Observable<TabItem[]>;

  constructor(private _tabManagerService: TabManagerService) {
    this.tabItems$ = _tabManagerService.tabItems$;
  }

  @HostListener('wheel', ['$event'])
  public onWheel($event: WheelEvent): void {
    const container: HTMLElement = $event.currentTarget as HTMLElement;
    container.scrollLeft += ($event.deltaY * SCROLL_FACTOR);  /* Otherwise scrolling is quite 'coarse' */
  }

  public onClickSwitchTo($event: Event): void {
    const radio: HTMLInputElement = $event.currentTarget as HTMLInputElement;
    if (radio.checked) {
      this._tabManagerService.switchTo(radio.value);

      radio.nextElementSibling?.scrollIntoView(false);
    }
  }

  public onClickCloseTab($event: Event): void {
    const button: HTMLButtonElement = $event.currentTarget as HTMLButtonElement;
    this._tabManagerService.close(button.value);
  }
}
