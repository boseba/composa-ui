import { type IconAttributes, type IconRenderMode } from '@composa/ui/models';

export interface SpriteSheetConfig {
  /**
   * URL or path to the spritesheet (must contain <symbol id="...">).
   */
  path: string;

  /**
   * Optional sheet name used as prefix for all symbol ids.
   * Example: name="material" => symbol "hide" becomes "material:hide"
   */
  name?: string;

  /**
   * How the icon should be rendered by default for this sheet.
   * - stroke: fill="none", stroke="currentColor"
   * - fill:   fill="currentColor", stroke removed
   */
  mode?: IconRenderMode;

  /**
   * Additional attributes to apply on the <svg> host when rendering icons from this sheet.
   * Example (Lucide):
   * { "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }
   */
  attributes?: IconAttributes;
}

export interface ComposaIconsConfig {
  spriteSheets?: readonly SpriteSheetConfig[];
}

export interface ComposaConfig {
  icons?: ComposaIconsConfig;
}
