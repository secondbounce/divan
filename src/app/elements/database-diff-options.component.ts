import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, Validators } from '@angular/forms';
import { catchError, map, Observable, of, takeUntil } from 'rxjs';

import { Logger, LogService } from '../core/logging';
import { ServerCredentials } from '../core/model';
import { DbDiffOptions } from '../diff';
import { ServerService, ToastService } from '../services';
import { ModalComponent } from '../ui-components';

// TODO: if no available servers, should display 'empty state' warning and close the form

@Component({
  selector: 'app-database-diff-options',
  templateUrl: './database-diff-options.component.html',
  styleUrls: ['./database-diff-options.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatabaseDiffOptionsComponent extends ModalComponent implements OnInit {
  public static readonly elementTag: string = 'database-diff-options-element';
  public availableServers: string[] = [];
  public sourceDatabases: string[] = [];
  public targetDatabases: string[] = [];
  /* Properties to expose controls requiring validation */
  public sourceServerControl: AbstractControl = new FormControl();
  public sourceDatabaseControl: AbstractControl = new FormControl();
  public targetServerControl: AbstractControl = new FormControl();
  public targetDatabaseControl: AbstractControl = new FormControl();
  private _options: DbDiffOptions = {
    sourceAlias: '',
    sourceDb: '',
    targetAlias: '',
    targetDb: ''
  };
  private readonly _log: Logger;

  constructor(private _serverService: ServerService,
              private _formBuilder: FormBuilder,
              private _toastService: ToastService,
              private _cdRef: ChangeDetectorRef,
              logService: LogService) {
    super();

    this._log = logService.getLogger('DatabaseDiffOptionsComponent');
    _serverService.serverAliases$.pipe(takeUntil(this.isBeingDestroyed$))
                                 .subscribe({
                                    next: (servers) => {
                                      this.availableServers = servers;
                                      this._cdRef.markForCheck();
                                    },
                                    error: (error) => {
                                      _toastService.showError('Error loading available servers:', error);
                                    }
                                  });
  }

  public ngOnInit(): void {
/* eslint-disable @typescript-eslint/unbound-method */
    this.formGroup = this._formBuilder.group({
      sourceServer: ['', Validators.required],
      sourceDatabase: ['', Validators.required],
      targetServer: ['', Validators.required],
      targetDatabase: ['', Validators.required]
/* eslint-enable @typescript-eslint/unbound-method */
    });

    this.sourceServerControl = this.getFormControl('sourceServer');
    this.sourceDatabaseControl = this.getFormControl('sourceDatabase');
    this.targetServerControl = this.getFormControl('targetServer');
    this.targetDatabaseControl = this.getFormControl('targetDatabase');

    this.updateForm();
  }

  @Input()
  public get options(): DbDiffOptions {
    return this._options;
  }
  public set options(options: DbDiffOptions) {
    this._options = options;

    if (this.isFormInitialized()) {
      this.updateForm();
    }
  }

  private updateForm(): void {
    /* We need to update the database lists first, otherwise setting the
      SELECTs won't work as there won't be a matching option.
    */
    this.updateDatabases(this.options.sourceAlias, this.sourceDatabases)
        .subscribe(sourceAlias => {
          /* Must ensure SELECTs have been updated with options before setting values */
          this._cdRef.detectChanges();

          if (sourceAlias.length === 0) {
            this.options.sourceAlias = '';
          }

          this.resetFormControlsState({
            sourceServer: sourceAlias,
            sourceDatabase: this.options.sourceDb
          });
        });

    this.updateDatabases(this.options.targetAlias, this.targetDatabases)
        .subscribe(targetAlias => {
          /* Must ensure SELECTs have been updated with options before setting values */
          this._cdRef.detectChanges();

          if (targetAlias.length === 0) {
            this.options.targetAlias = '';
          }

          this.resetFormControlsState({
            targetServer: targetAlias,
            targetDatabase: this.options.targetDb
          });
        });
  }

  public updateSourceDatabases($event: Event): void {
    const select: HTMLSelectElement = $event.currentTarget as HTMLSelectElement;
    this.updateDatabases(select.value, this.sourceDatabases)
        .subscribe();
  }

  public updateTargetDatabases($event: Event): void {
    const select: HTMLSelectElement = $event.currentTarget as HTMLSelectElement;
    this.updateDatabases(select.value, this.targetDatabases)
        .subscribe();
  }

  private updateDatabases(serverAliasOrAddress: string, databases: string[]): Observable<string> {
    databases.length = 0;   /* Clear existing dbs regardless (won't be valid if no credentials found anyway) */

    const credentials: ServerCredentials | undefined = serverAliasOrAddress.length > 0
                                                          ? this._serverService.getServerCredentials(serverAliasOrAddress)
                                                          : undefined;
    if (credentials) {
      return this._serverService.getDatabases(credentials)
                                .pipe(map((databaseNames) => {
                                        databases.push(...databaseNames);
                                        this._cdRef.markForCheck();
                                        return credentials.alias;
                                      }),
                                      catchError(error => {
                                        this._log.error(`Error retrieving databases for ${credentials.alias}`, error);
                                        this._toastService.showError(`Error retrieving databases for ${credentials.alias}\n\n(See logs for error details.)`);
                                        return '';
                                      }));
    } else {
      return of('');
    }
  }

  public swapSourceTarget(): void {
    const formValues: any = this.formGroup.value;
    const sourceDatabases: string[] = this.sourceDatabases;

    this.sourceDatabases = this.targetDatabases;
    this.targetDatabases = sourceDatabases;

    /* Must ensure SELECTs have been updated with options before setting values */
    this._cdRef.detectChanges();

    this.resetFormControlsState({
      sourceServer: formValues.targetServer,
      sourceDatabase: formValues.targetDatabase,
      targetServer: formValues.sourceServer,
      targetDatabase: formValues.sourceDatabase
    });
  }

  public onSubmit(): void {
    if (this.isFormValid()) {
      const formValues: any = this.formGroup.value;
      const sourceCredentials: ServerCredentials | undefined = this._serverService.getServerCredentials(formValues.sourceServer);
      const targetCredentials: ServerCredentials | undefined = this._serverService.getServerCredentials(formValues.targetServer);

      if (sourceCredentials) {
        if (targetCredentials) {
          this.options.sourceAlias = formValues.sourceServer;
          this.options.sourceDb = formValues.sourceDatabase;
          this.options.targetAlias = formValues.targetServer;
          this.options.targetDb = formValues.targetDatabase;
          this.ok(this.options);
        } else {
          this.targetDatabaseControl.setErrors({ required: true });
        }
      } else {
        this.sourceDatabaseControl.setErrors({ required: true });
      }
    }
  }

  public onClickCancel(): void {
    this.cancel();
  }
}
