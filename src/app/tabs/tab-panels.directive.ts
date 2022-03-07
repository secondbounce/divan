import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[appTabPanels]'
})
export class TabPanelsDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
