import { Directive, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';

import { stringify } from '../utility';

@Directive()
// eslint-disable-next-line @angular-eslint/directive-class-suffix, -- required for abstract base classes that would otherwise have to be decorated with @Component to avoid NG2007 errors
export abstract class FormComponent implements OnDestroy {
  public isBeingDestroyed$: Subject<void> = new Subject();
  public formGroup: FormGroup = new FormGroup({});

  public ngOnDestroy(): void {
    this.isBeingDestroyed$.next();
    this.isBeingDestroyed$.complete();
  }

  public getFormControl(name: string): AbstractControl {
    const control: AbstractControl | null = this.formGroup?.get(name);
    if (!control) {
      throw new Error(`Control '${name}' could not be found`);
    }

    return control;
  }

  public isFormInitialized(): boolean {
    return Object.keys(this.formGroup.controls).length > 0;
  }

  public isFormValid(): boolean {
    let isValid: boolean = false;

    if (this.formGroup.valid) {
      isValid = true;
    } else {
      const invalidControls: AbstractControl[] = this.updateControls(this.formGroup);
      if (invalidControls.length > 0) {
        this.markInvalidControls(invalidControls);
      }
    }

    return isValid;
  }

  /** Virtual method intended to be overridden in forms that need to perform operations when invalid
   * controls are identified.
   */
  public markInvalidControls(_invalidControls: AbstractControl[]): void {
    /* Nothing to do */
  }

  /**
   * Gets the specified control's (or form's, if @param name is '') state as a JSON string - provided for debugging purposes
   */
  protected getControlState(name: string): string {
    const control: AbstractControl | null = (name.length > 0 ? this.getFormControl(name)
                                                             : this.formGroup);
// TODO: work out the best alternative to disabling this
    // eslint-disable-next-line @typescript-eslint/ban-types
    let state: {} = {};

    if (control) {
      state = {
        status: control.status,
        errors: control.errors,
        invalid: control.invalid,
        pending: control.pending,
        pristine: control.pristine,
        valid: control.valid
      };
    }
    return stringify(state);
  }

  protected resetFormControlsState(values: { [key: string]: any } | undefined): void {
    if (this.isFormInitialized()) {
      if (values) {
        this.formGroup.patchValue(values);
      }

      Object.entries(this.formGroup.controls).forEach(([_key, control]) => {
        control.markAsPristine();
        control.markAsUntouched();
      });
    }
  }

  private updateControls(formGroup: FormGroup): AbstractControl[] {
    const invalidControls: AbstractControl[] = [];

    Object.entries(formGroup.controls).forEach(([_key, control]) => {
      if (control instanceof FormControl) {
        control.markAsTouched({onlySelf: true}); // Otherwise validation color is not shown
        if (!control.valid) {
          invalidControls.push(control);
        }
      } else if (control instanceof FormGroup) {
        const innerInvalidControls: AbstractControl[] = this.updateControls(control);
        invalidControls.push(...innerInvalidControls);
      }
    });

    return invalidControls;
  }
}
