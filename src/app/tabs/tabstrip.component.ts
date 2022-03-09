import { AfterViewChecked, Component, ElementRef, HostListener } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { TabManagerService } from '../services';
import { TabItem } from './tab-item';

const SCROLL_FACTOR: number = 0.5;

@Component({
  selector: 'app-tabstrip',
  templateUrl: './tabstrip.component.html',
  styleUrls: ['./tabstrip.component.scss']
})
export class TabstripComponent implements AfterViewChecked {
  public tabItems$: Observable<TabItem[]>;
  private _scrollAfterNextViewCheck: boolean = false;

  constructor(private _elementRef: ElementRef,
              private _tabManagerService: TabManagerService) {
    this.tabItems$ = _tabManagerService.tabItems$.pipe(tap(tabItems => {
                                                        if (tabItems.length > 0) {
                                                          this._scrollAfterNextViewCheck = true;
                                                        }
                                                      }));
  }

  public ngAfterViewChecked(): void {
    if (this._scrollAfterNextViewCheck) {
      this.scrollActiveTabIntoView();
      this._scrollAfterNextViewCheck = false;
    }
  }

  @HostListener('wheel', ['$event'])
  public onWheel($event: WheelEvent): void {
    $event.preventDefault();  /* Stop page scrolling vertically, if it's also bigger than window */
    const container: HTMLElement = $event.currentTarget as HTMLElement;
    container.scrollLeft += ($event.deltaY * SCROLL_FACTOR);  /* Otherwise scrolling is quite 'coarse' */
  }

  public onClickSwitchTo($event: Event): void {
    const radio: HTMLInputElement = $event.currentTarget as HTMLInputElement;
    if (radio.checked) {
      this._tabManagerService.switchTo(radio.value);
    }
  }

  public onClickCloseTab($event: Event): void {
    const button: HTMLButtonElement = $event.currentTarget as HTMLButtonElement;
    this._tabManagerService.close(button.value);
  }

  private scrollActiveTabIntoView(): void {
    const tabstrip: HTMLElement = this._elementRef.nativeElement as HTMLElement;
    const radiobuttons: HTMLCollectionOf<HTMLInputElement> = tabstrip.getElementsByTagName('input');

    /* eslint-disable @typescript-eslint/prefer-for-of -- false positive: HTMLCollections don't have an iterator (at the moment) */
    for (let i: number = 0; i < radiobuttons.length; i++) {
      const radio: HTMLInputElement = radiobuttons[i];

      if (radio.checked) {
        radio.nextElementSibling?.scrollIntoView(false);
        break;
      }
    }
  }
}
