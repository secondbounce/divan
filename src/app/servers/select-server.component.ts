import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, Validators } from '@angular/forms';

import { Logger, LogService } from '../core/logging';
import { ServerCredentials } from '../core/model';
import { ServerService } from '../services';
import { ModalComponent } from '../ui-components';

@Component({
  selector: 'app-select-server',
  templateUrl: './select-server.component.html',
  styleUrls: ['./select-server.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectServerComponent extends ModalComponent implements OnInit {
  public static readonly elementTag: string = 'select-server-element';
  private _credentials: ServerCredentials = new ServerCredentials();
  /* Properties to expose controls requiring validation */
  public addressControl: AbstractControl = new FormControl();
  public usernameControl: AbstractControl = new FormControl();
  public passwordControl: AbstractControl = new FormControl();
  private readonly _log: Logger;

  constructor(private _serverService: ServerService,
              private _formBuilder: FormBuilder,
              logService: LogService) {
    super();
    this._log = logService.getLogger('SelectServerComponent');
  }

  public ngOnInit(): void {
/* eslint-disable @typescript-eslint/unbound-method */
    this.formGroup = this._formBuilder.group({
      alias: [this._credentials.alias],
      address: [this._credentials.address, [Validators.required,
// TODO: sort out regex
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
// TODO: display some sort of error message
                              }
                            });
      }
    }
  }

  public onClickCancel(): void {
    this.cancel();
  }
}
