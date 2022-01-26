import { Directive, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { FormComponent } from './form.component';

@Directive()
// eslint-disable-next-line @angular-eslint/directive-class-suffix, -- required for abstract base classes that would otherwise have to be decorated with @Component to avoid NG2007 errors
export abstract class PageComponent extends FormComponent implements OnInit {
  private _pageTitle: string = '';

  constructor(protected titleService: Title) {
    super();
  }

  public ngOnInit(): void {
    this.titleService.setTitle(this._pageTitle);
  }

  public get pageTitle(): string {
    return this._pageTitle;
  }
  public set pageTitle(title: string) {
    this._pageTitle = title;
    this.titleService.setTitle(title);
  }
}
