import { type AbstractControl } from '@angular/forms';

export type ValidationErrorMessage =
  | string
  | ((control: AbstractControl, value: unknown) => string);