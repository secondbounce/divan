import { Directive, OnDestroy } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';

import { FormComponent } from '../ui-components';

@Directive()
export abstract class TabPanelComponent<TData> extends FormComponent implements OnDestroy {
  public title$: Observable<string>;
  private _title$: ReplaySubject<string> = new ReplaySubject<string>(1);
  private _title: string = '';
  private _data: TData | undefined;

  constructor() {
    super();

    this.title$ = this._title$.asObservable();
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();

    this._title$.complete();
  }

  public get title(): string {
    return this._title;
  }

  public setTitle(title: string): void {
    this._title = title;
    this._title$.next(title);
  }

  public get data(): TData | undefined {
    return this._data;
  }
  public setData(data: TData | undefined): void {
    this._data = data;
  }
}
