import { Injectable, inject } from '@angular/core';
import { type ComposaConfig, type ComposaIconsConfig } from '@composa/ui/core';
import { COMPOSA_CONFIG } from '@composa/ui/core/internal';

@Injectable({ providedIn: 'root' })
export class ComposaConfigService {
  private readonly _config: ComposaConfig = inject(COMPOSA_CONFIG, { optional: true }) ?? {};

  public get icons(): ComposaIconsConfig {
    if (!this._config.icons) {
      console.warn('[Composa] No icons configuration provided');
    }

    return this._config.icons ?? {};
  }
}
