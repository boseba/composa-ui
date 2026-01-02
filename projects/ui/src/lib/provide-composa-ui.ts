import {
  inject,
  makeEnvironmentProviders,
  provideAppInitializer,
  type EnvironmentProviders,
} from '@angular/core';

import { type ComposaConfig } from '@composa/ui/core';
import { COMPOSA_CONFIG } from '@composa/ui/core/internal';
import { IconRegistryService } from '@composa/ui/services';

export function provideComposaUi(config: ComposaConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: COMPOSA_CONFIG, useValue: config },
    provideAppInitializer(async (): Promise<void> => {
      const registry: IconRegistryService = inject(IconRegistryService);
      await registry.init();
    }),
  ]);
}
