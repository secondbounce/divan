import { Type } from '@angular/core';

import { TabPanelComponent } from './tab-panel.component';

export class TabPanel {
  public readonly key: string = Date.now().toString();   /* Not the best key but it'll do */

  constructor(public component: Type<TabPanelComponent<any>>, public data: any) {}
}
