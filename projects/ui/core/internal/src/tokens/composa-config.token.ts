import { InjectionToken, isDevMode } from '@angular/core';
import type { ComposaConfig } from '@composa/ui/core';

export const COMPOSA_CONFIG: InjectionToken<ComposaConfig> = new InjectionToken<ComposaConfig>(
  'COMPOSA_CONFIG',
  {
    factory: (): ComposaConfig => {
      if (isDevMode()) {
        throw new Error(
          '[Composa UI] COMPOSA_CONFIG is missing. Did you call provideComposaUi(...)?'
        );
      }
      return {} satisfies ComposaConfig;
    },
  }
);
