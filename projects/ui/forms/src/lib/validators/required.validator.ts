import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';
import { type RequiredValidationError } from '../models';
import { type ValidationErrorMessage } from '../models/validation-error-message.type';

export interface RequiredValidatorOptions {
  message?: ValidationErrorMessage;
}

function isEmptyInputValue(value: string): boolean {
  return value.length === 0;
}

function isMessageFunction(
  message: ValidationErrorMessage | undefined,
): message is (control: AbstractControl, value: unknown) => string {
  return typeof message === 'function';
}

function resolveMessage(
  message: ValidationErrorMessage | undefined,
  control: AbstractControl,
  value: string,
): string | undefined {
  if (isMessageFunction(message)) {
    return message(control, value);
  }

  return message;
}

export function requiredValidator(options: RequiredValidatorOptions = {}): ValidatorFn {
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
