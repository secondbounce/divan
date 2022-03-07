import { Component, ComponentRef, OnDestroy, ViewChild, ViewContainerRef, ViewEncapsulation, ViewRef } from '@angular/core';
import { Observable } from 'rxjs';

import { TabManagerService } from '../services';
import { TabPanel } from './tab-panel';
import { TabPanelComponent } from './tab-panel.component';
import { TabPanelsDirective } from './tab-panels.directive';

@Component({
  selector: 'app-tab-panels',
  template: '<ng-template appTabPanels></ng-template>',
  styleUrls: ['./tab-panels.component.scss'],
  encapsulation: ViewEncapsulation.None   /* To ensure CSS is applied to dynamically-loaded components */
})
export class TabPanelsComponent implements OnDestroy {
  @ViewChild(TabPanelsDirective, {static: true}) private _tabPanelHost!: TabPanelsDirective;
  private _viewRefs: Map<string, ViewRef> = new Map<string, ViewRef>();

  constructor(private _tabManagerService: TabManagerService) {
    _tabManagerService.registerOpenTabHandler(this.openTab);
    _tabManagerService.registerSwitchToTabHandler(this.switchToTab);
    _tabManagerService.registerCloseTabHandler(this.closeTab);
  }

  public ngOnDestroy(): void {
    this._tabPanelHost.viewContainerRef.clear();
  }

  private openTab = (tabPanel: TabPanel): Observable<string> => {
    const viewContainerRef: ViewContainerRef = this._tabPanelHost.viewContainerRef;

    const componentRef: ComponentRef<TabPanelComponent<any>> = viewContainerRef.createComponent<TabPanelComponent<any>>(tabPanel.component);
    componentRef.instance.setData(tabPanel.data);
    this._viewRefs.set(tabPanel.key, componentRef.hostView);

    return componentRef.instance.title$;
  };

  private switchToTab = (key: string): void => {
    const viewRef: ViewRef | undefined = this._viewRefs.get(key);

    if (viewRef) {
      const viewContainerRef: ViewContainerRef = this._tabPanelHost.viewContainerRef;
      const index: number = viewContainerRef.indexOf(viewRef);

      if (index >= 0) {
        viewContainerRef.move(viewRef, viewContainerRef.length - 1);
      }
    }
  };

  private closeTab = (key: string): void => {
    const viewRef: ViewRef | undefined = this._viewRefs.get(key);

    if (viewRef) {
      const viewContainerRef: ViewContainerRef = this._tabPanelHost.viewContainerRef;
      const index: number = viewContainerRef.indexOf(viewRef);

      if (index >= 0) {
        viewContainerRef.remove(index);
      }
      this._viewRefs.delete(key);
    }
  };
}
