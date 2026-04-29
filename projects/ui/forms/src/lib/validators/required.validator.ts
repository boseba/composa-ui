import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { RequiredValidationError } from '../models';
import { ValidationErrorMessage } from '../models/validation-error-message.type';

export interface RequiredValidatorOptions {
  message?: ValidationErrorMessage;
}

function isEmptyInputValue(value: string): boolean {
  return value == null || value.length === 0;
}

function resolveMessage(
  message: ValidationErrorMessage | undefined,
  control: AbstractControl,
  value: string,
): string | undefined {
  if (typeof message === 'function') {
    return message(control, value);
  }

  return message;
}

export function requiredValidator(
  options: RequiredValidatorOptions = {},
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value as string;

    if (!isEmptyInputValue(value)) {
      return null;
    }

    const error: RequiredValidationError = {
      value,
      message: resolveMessage(options.message, control, value),
    };

    return {
      required: error,
    };
  };
}
