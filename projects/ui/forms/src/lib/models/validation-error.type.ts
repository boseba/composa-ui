export interface FormValidationError {
  value: unknown;
  message?: string;
}

export interface ExcludedValuesValidationError extends FormValidationError {
  value: string;
  values: readonly string[];
  caseSensitive: boolean;
  trim: boolean;
}

export interface UrlValidationError extends FormValidationError {
  value: string;
  allowedProtocols: readonly string[];
  requireProtocol: boolean;
}

export interface RequiredValidationError extends FormValidationError {
  value: string;
}
