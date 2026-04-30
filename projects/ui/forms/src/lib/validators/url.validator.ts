import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';
import { type UrlValidationError } from '../models';
import { type ValidationErrorMessage } from '../models/validation-error-message.type';

export interface UrlValidatorOptions {
  allowedProtocols?: readonly string[];
  requireProtocol?: boolean;
  message?: ValidationErrorMessage;
}

function resolveMessage(
  message: ValidationErrorMessage | undefined,
  control: AbstractControl,
  value: unknown,
): string | undefined {
  if (typeof message === 'function') {
    return message(control, value);
  }

  return message;
}

function isValidUrl(
  value: string,
  allowedProtocols: readonly string[],
  requireProtocol: boolean,
): boolean {
  try {
    const url: URL = new URL(value);

    if (requireProtocol && !url.protocol) {
      return false;
    }

    return allowedProtocols.includes(url.protocol);
  } catch {
    return false;
  }
}

export function urlValidator(
  options: UrlValidatorOptions = {},
): ValidatorFn {
  const allowedProtocols: readonly string[] =
    options.allowedProtocols ?? ['http:', 'https:'];
  const requireProtocol: boolean = options.requireProtocol ?? true;

  return (control: AbstractControl): ValidationErrors | null => {
    const value: unknown = control.value;

    if (typeof value !== 'string' || value.length === 0) {
      return null;
    }

    if (isValidUrl(value, allowedProtocols, requireProtocol)) {
      return null;
    }

    const error: UrlValidationError = {
      value,
      allowedProtocols,
      requireProtocol,
      message: resolveMessage(options.message, control, value),
    };

    return {
      url: error,
    };
  };
}
