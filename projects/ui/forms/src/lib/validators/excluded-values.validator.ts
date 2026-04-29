import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ExcludedValuesValidationError } from '../models';
import { ValidationErrorMessage } from '../models/validation-error-message.type';

export interface ExcludedValuesValidatorOptions {
  values: readonly string[];
  caseSensitive?: boolean;
  trim?: boolean;
  message?: ValidationErrorMessage;
}

function normalizeValue(
  value: string,
  caseSensitive: boolean,
  trim: boolean,
): string {
  const normalizedTrimmedValue: string = trim ? value.trim() : value;

  return caseSensitive
    ? normalizedTrimmedValue
    : normalizedTrimmedValue.toLowerCase();
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

export function excludedValuesValidator(
  options: ExcludedValuesValidatorOptions,
): ValidatorFn {
  const caseSensitive: boolean = options.caseSensitive ?? true;
  const trim: boolean = options.trim ?? true;

  const normalizedValues: ReadonlySet<string> = new Set(
    options.values.map((item: string) =>
      normalizeValue(item, caseSensitive, trim),
    ),
  );

  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    if (typeof value !== 'string') {
      return null;
    }

    const normalizedValue: string = normalizeValue(
      value,
      caseSensitive,
      trim,
    );

    if (!normalizedValues.has(normalizedValue)) {
      return null;
    }

    const error: ExcludedValuesValidationError = {
      value,
      values: options.values,
      caseSensitive,
      trim,
      message: resolveMessage(options.message, control, value),
    };

    return {
      excludedValues: error,
    };
  };
}
