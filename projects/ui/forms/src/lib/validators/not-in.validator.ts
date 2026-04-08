import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface ExcludedValuesValidatorOptions {
  values: readonly string[];
  caseSensitive?: boolean;
  trim?: boolean;
  message?: string | ((value: string) => string);
}

export interface ExcludedValuesValidationError {
  value: string;
  values: readonly string[];
  caseSensitive?: boolean;
  trim?: boolean;
  message?: string;
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

export function excludedValuesValidator(options: ExcludedValuesValidatorOptions): ValidatorFn {
  const caseSensitive: boolean = options.caseSensitive ?? true;
  const trim: boolean = options.trim ?? true;

  const normalizedValues: ReadonlySet<string> = new Set(
    options.values.map((value: string) =>
      normalizeValue(value, caseSensitive, trim),
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

    const message: string | undefined =
      typeof options.message === 'function'
        ? options.message(value)
        : options.message;

    const error: ExcludedValuesValidationError = {
      value,
      values: options.values,
      caseSensitive,
      trim,
      message,
    };

    return {
      excludedValues: error,
    };
  };
}