import { type ValidatorFn } from '@angular/forms';
import {
  type ExcludedValuesValidatorOptions,
  excludedValuesValidator,
} from './validators/excluded-values.validator';
import { type RequiredValidatorOptions, requiredValidator } from './validators/required.validator';
import { type UrlValidatorOptions, urlValidator } from './validators/url.validator';

export class ComposaValidators {
  public static required(options?: RequiredValidatorOptions): ValidatorFn {
    return requiredValidator(options);
  }

  public static url(options?: UrlValidatorOptions): ValidatorFn {
    return urlValidator(options);
  }

  public static excludedValues(options: ExcludedValuesValidatorOptions): ValidatorFn {
    return excludedValuesValidator(options);
  }
}
