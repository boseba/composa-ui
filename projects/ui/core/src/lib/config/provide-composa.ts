import { makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { COMPOSA_CONFIG } from '@composa/ui/core/internal';
import type { ComposaConfig } from './composa-config';

export function provideComposa(config: ComposaConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: COMPOSA_CONFIG, useValue: config }]);
}
