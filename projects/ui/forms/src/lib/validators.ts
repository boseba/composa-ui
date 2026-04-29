import { ValidatorFn } from '@angular/forms';
import {
  ExcludedValuesValidatorOptions,
  excludedValuesValidator,
} from './validators/excluded-values.validator';
import { RequiredValidatorOptions, requiredValidator } from './validators/required.validator';
import { UrlValidatorOptions, urlValidator } from './validators/url.validator';

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
