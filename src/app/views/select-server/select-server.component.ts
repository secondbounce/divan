import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, Validators } from '@angular/forms';

import { Logger, ServerCredentials } from '../../core/model';
import { LogService, ServerService, ToastService } from '../../services';
import { ModalComponent } from '../../ui-components';

// TODO: display progress bar somewhere (if server not available, timeout creates a delay, so need to stop user clicking again, etc)

@Component({
  selector: 'app-select-server',
  templateUrl: './select-server.component.html',
  styleUrls: ['./select-server.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectServerComponent extends ModalComponent implements OnInit {
  public static readonly elementTag: string = 'select-server-element';
  public errorMessage: string = '';
  private _credentials: ServerCredentials = new ServerCredentials();
  /* Properties to expose controls requiring validation */
  public addressControl: AbstractControl = new FormControl();
  public usernameControl: AbstractControl = new FormControl();
  public passwordControl: AbstractControl = new FormControl();
  private readonly _log: Logger;

  constructor(private _serverService: ServerService,
              private _formBuilder: FormBuilder,
              private _toastService: ToastService,
              private _cdRef: ChangeDetectorRef,
              logService: LogService) {
    super();
    this._log = logService.getLogger('SelectServerComponent');
  }

  public ngOnInit(): void {
/* eslint-disable @typescript-eslint/unbound-method */
    this.formGroup = this._formBuilder.group({
      alias: [this._credentials.alias],
      address: [this._credentials.address, [Validators.required,
// TODO: sort out regex (is this needed if type="url"? yes, we use it if it fails to create a URL below)
                                            Validators.pattern('.*')
                                           ]],
      username: [this._credentials.username, [Validators.required]],
      password: [this._credentials.password, [Validators.required]]
/* eslint-enable @typescript-eslint/unbound-method */
    });

    this.addressControl = this.getFormControl('address');
    this.usernameControl = this.getFormControl('username');
    this.passwordControl = this.getFormControl('password');
  }

  @Input()
  public get credentials(): ServerCredentials | undefined {
    return this._credentials;
  }
  public set credentials(credentials: ServerCredentials | undefined) {
    if (credentials) {
      this._credentials = { ...credentials };   /* Clone it */

      if (this.isFormInitialized()) {
        this.formGroup.patchValue({
          alias: credentials.alias,
          address: credentials.address,
          username: credentials.username,
          password: credentials.password
        });
      }
    } else {
      this._credentials = new ServerCredentials();
    }
  }

  public onSubmit(): void {
    if (this.isFormValid()) {
      const formValues: any = this.formGroup.value;
      let address: string | undefined;

      try {
        /* This will validate the URL format for us */
        const url: URL = new URL(formValues.address);

       /* Clear any elements that shouldn't be set, just in case */
        url.pathname = '';
        url.hash = '';
        url.search = '';
        url.username = '';
        url.password = '';

        address = url.toString();
      } catch (_error) {
        this.addressControl.setErrors({ pattern: true });
      }

      if (address) {
        const alias: string = formValues.alias.length > 0 ? formValues.alias
                                                          : address;
        const credentials: ServerCredentials = {
          alias,
          address,
          username: formValues.username,
          password: formValues.password
        };

        this._serverService.getServer(credentials)
                           .subscribe({
                              next: (server) => {
                                this._credentials = credentials;
                                this.ok(server);
                              },
                              error: (error) => {
                                this._log.error(`Unable to get server for ${credentials.address}`, error);
                                if (error instanceof HttpErrorResponse) {
                                  this.handleHttpErrors(error);
                                } else {
                                  this._toastService.showWarning('Unable to access server:', error);
                                }
                              }
                            });
      }
    } else {
      this.errorMessage = '';
    }
  }

  public onClickCancel(): void {
    this.cancel();
  }

  private handleHttpErrors(response: HttpErrorResponse): void {
    switch (response.status) {
      case HttpStatusCode.Unauthorized:
        this.errorMessage = 'Name or password is incorrect';
        break;

      case 0:
      default:
        this.errorMessage = 'Unable to connect to server: "' + response.message + '"';
        break;
    }

    this._cdRef.markForCheck();
  }
}
