import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';

import { DbExportOptions } from '../../core/model';
import { ModalComponent } from '../../ui-components';

@Component({
  selector: 'app-database-export-options',
  templateUrl: './database-export-options.component.html',
  styleUrls: ['./database-export-options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatabaseExportOptionsComponent extends ModalComponent implements OnInit {
  public static readonly elementTag: string = 'app-database-export-options';
  private _options: DbExportOptions = {
    serverAlias: '',
    dbName: '',
    includeDocs: false,
    includeRevs: false,
    exportAsJson: true
  };

  constructor(private _formBuilder: FormBuilder) {
    super();
  }

  public ngOnInit(): void {
    this.formGroup = this._formBuilder.group({
/* eslint-disable @typescript-eslint/unbound-method */
      includeDocs: this._options.includeDocs,
      includeRevs: this._options.includeRevs,
      exportAs: this._options.exportAsJson
/* eslint-enable @typescript-eslint/unbound-method */
    });

    this.updateForm();
  }

  @Input()
  public get options(): DbExportOptions {
    return this._options;
  }
  public set options(options: DbExportOptions) {
    this._options = options;

    if (this.isFormInitialized()) {
      this.updateForm();
    }
  }

  private updateForm(): void {
    this.resetFormControlsState({
      includeDocs: this._options.includeDocs,
      includeRevs: this._options.includeRevs,
      exportAs: this._options.exportAsJson
    });
  }

  public onSubmit(): void {
    if (this.isFormValid()) {
      const formValues: any = this.formGroup.value;
      this._options.includeDocs = formValues.includeDocs;
      this._options.includeRevs = formValues.includeRevs;
      this._options.exportAsJson = formValues.exportAs;
      this.ok(this._options);
    }
  }

  public onClickCancel(): void {
    this.cancel();
  }
}
