import { Injectable, NgZone, Type } from '@angular/core';
import { Observable, ReplaySubject, takeUntil } from 'rxjs';

import { ARRAY_LAST_ITEM_INDEX } from '../constants';
import { TabItem, TabPanel, TabPanelComponent } from '../tabs';
import { removeFromArray } from '../utility';
import { BaseService } from './base.service';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root'
})
export class TabManagerService extends BaseService {
  public tabItems$: ReplaySubject<TabItem[]> = new ReplaySubject<TabItem[]>(1);
  private _openTabHandler: ((tabPanel: TabPanel) => Observable<[string, string]>) | undefined;
  private _switchToTabHandler: ((key: string) => void) | undefined;
  private _closeTabHandler: ((key: string) => void) | undefined;
  private _tabItems: Map<string, TabItem> = new Map<string, TabItem>();
  private _tabItemOrder: string[] = [];

  constructor(private _ngZone: NgZone,
              logService: LogService) {
    super(logService);

    this.updateTabItemValues();

    this.isBeingDestroyed$.subscribe(() => {
      this.tabItems$.complete();
    });
  }

  public registerOpenTabHandler(handler: (tabPanel: TabPanel) => Observable<[string, string]>): void {
    this._openTabHandler = handler;
  }

  public registerSwitchToTabHandler(handler: (key: string) => void): void {
    this._switchToTabHandler = handler;
  }

  public registerCloseTabHandler(handler: (key: string) => void): void {
    this._closeTabHandler = handler;
  }

  public open(component: Type<TabPanelComponent<any>>, data: any): void {
    const tabPanel: TabPanel = new TabPanel(component, data);
    const key: string = tabPanel.key;

    /* Need to add to map first since title change handler relies on it being available */
    this._tabItems.set(tabPanel.key, { key: tabPanel.key, title: '', fullTitle: '', active: true});

    this._ngZone.run(() => {
      if (this._openTabHandler) {
        this._openTabHandler(tabPanel).pipe(takeUntil(this.isBeingDestroyed$))
                                      .subscribe(titles => {
                                        const tabItem: TabItem | undefined = this._tabItems.get(key);

                                        if (tabItem) {
                                          tabItem.title = titles[0];
                                          tabItem.fullTitle = titles[1];
                                          this.updateTabItemValues();
                                        }
                                      });
      }
    });

    const activeKey: string = this._tabItemOrder.at(ARRAY_LAST_ITEM_INDEX) ?? '';
    const activeTabItem: TabItem | undefined = this._tabItems.get(activeKey);

    if (activeTabItem) {
      activeTabItem.active = false;
    }

    this._tabItemOrder.push(tabPanel.key);
    this.updateTabItemValues();
  }

  public switchTo(key: string): void {
    const tabItem: TabItem | undefined = this._tabItems.get(key);

    if (tabItem) {
      const activeKey: string = this._tabItemOrder.at(ARRAY_LAST_ITEM_INDEX) ?? '';
      const activeTabItem: TabItem | undefined = this._tabItems.get(activeKey);

      tabItem.active = true;
      if (activeTabItem) {
        activeTabItem.active = false;
      }

      removeFromArray(this._tabItemOrder, key);
      this._tabItemOrder.push(key);

      if (this._switchToTabHandler) {
        this._switchToTabHandler(key);
      }
      this.updateTabItemValues();
    }
  }

  public close(key: string): void {
    const tabItem: TabItem | undefined = this._tabItems.get(key);

    if (tabItem) {
      /* If we're closing the active tab, switch to the previous tab, if any, beforehand */
      if (tabItem.active) {
        this._tabItemOrder.pop();

        const activeKey: string = this._tabItemOrder.at(ARRAY_LAST_ITEM_INDEX) ?? '';
        const activeTabItem: TabItem | undefined = this._tabItems.get(activeKey);

        if (activeTabItem) {
          activeTabItem.active = true;
          if (this._switchToTabHandler) {
            this._switchToTabHandler(activeTabItem.key);
          }
        }
      } else {
        removeFromArray(this._tabItemOrder, key);
      }

      if (this._closeTabHandler) {
        this._closeTabHandler(key);
      }
      this._tabItems.delete(key);
      this.updateTabItemValues();
    }
  }

  private updateTabItemValues(): void {
    this.tabItems$.next(Array.from(this._tabItems.values()));
  }
}
