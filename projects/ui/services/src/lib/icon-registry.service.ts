import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import type { SpriteSheetConfig } from '@composa/ui/core';
import type { ResolvedIcon } from '@composa/ui/core/internal';
import type { IconAttributes, IconRenderMode } from '@composa/ui/models';
import { firstValueFrom, type Observable } from 'rxjs';
import { ComposaConfigService } from './composa-config.service';

type SpriteSheetUrl = string;

const DEFAULT_MODE: IconRenderMode = 'stroke';
const EMPTY_ATTRS: Readonly<IconAttributes> = Object.freeze({});

@Injectable({ providedIn: 'root' })
export class IconRegistryService {
  private readonly _http: HttpClient = inject(HttpClient);
  private readonly _document: Document = inject(DOCUMENT);
  private readonly _platformId: object = inject(PLATFORM_ID);
  private readonly _composaConfig: ComposaConfigService = inject(ComposaConfigService);

  private readonly _hostId: string = 'composa-icon-spritesheet';

  private readonly _registeredUrls: Set<SpriteSheetUrl> = new Set<SpriteSheetUrl>();
  private readonly _mergedSymbolIds: Set<string> = new Set<string>();

  private readonly _sheetByName: Map<string, SpriteSheetConfig> = new Map<
    string,
    SpriteSheetConfig
  >();
  private _unnamedSheet: SpriteSheetConfig | null = null;

  private readonly _pendingSheets: SpriteSheetConfig[] = [];
  private _merging: boolean = false;

  /**
   * Initializes the registry from the global Composa configuration.
   * Safe to call multiple times.
   */
  public async init(): Promise<void> {
    if (!this._isBrowser()) {
      return;
    }

    const configuredSheets: readonly SpriteSheetConfig[] =
      this._composaConfig.icons.spriteSheets ?? [];

    const normalizedSheets: SpriteSheetConfig[] = this._normalizeSheets(configuredSheets);
    if (normalizedSheets.length === 0) {
      return;
    }

    await this.addSpriteSheets(normalizedSheets);
  }

  /**
   * Adds sprite sheets to the registry and merges their symbols into the document.
   * - URLs are deduplicated
   * - Symbols are merged once (by final symbol id)
   */
  public async addSpriteSheets(sheets: readonly SpriteSheetConfig[]): Promise<void> {
    if (!this._isBrowser()) {
      return;
    }

    const normalizedSheets: SpriteSheetConfig[] = sheets
      .map((sheet: SpriteSheetConfig): SpriteSheetConfig => this._normalizeSheet(sheet))
      .filter((sheet: SpriteSheetConfig): boolean => sheet.path.length > 0);

    for (const sheet of normalizedSheets) {
      if (this._registeredUrls.has(sheet.path)) {
        continue;
      }

      this._registeredUrls.add(sheet.path);

      if (sheet.name !== undefined) {
        this._sheetByName.set(sheet.name, sheet);
      } else {
        this._unnamedSheet ??= sheet;
      }

      this._pendingSheets.push(sheet);
    }

    if (this._merging) {
      return;
    }

    this._merging = true;
    try {
      while (this._pendingSheets.length > 0) {
        const batch: SpriteSheetConfig[] = this._pendingSheets.splice(0);

        const contents: string[] = await Promise.all(
          batch.map((sheet: SpriteSheetConfig): Promise<string> => this._loadSheet(sheet.path))
        );

        this._injectSymbolsFromSheets(contents, batch);
      }
    } finally {
      this._merging = false;
    }
  }

  /**
   * Resolves an icon reference into a sprite-symbol href + rendering metadata.
   *
   * Supported inputs:
   * - "close"
   * - "#close"
   * - "sheet:close"
   * - "#sheet:close"
   *
   * Returns null when the reference is invalid.
   */
  public resolve(reference: string): ResolvedIcon | null {
    const raw: string = reference.trim();
    if (raw.length === 0) {
      return null;
    }

    const normalizedRef: string = raw.startsWith('#') ? raw.slice(1).trim() : raw;
    if (normalizedRef.length === 0) {
      return null;
    }

    const parsed: { sheetName: string | null; symbolId: string } =
      this._parseSymbolRef(normalizedRef);
    const sheet: SpriteSheetConfig | null =
      parsed.sheetName !== null
        ? this._sheetByName.get(parsed.sheetName) ?? null
        : this._unnamedSheet;

    return {
      href: `#${parsed.symbolId}`,
      mode: sheet?.mode ?? DEFAULT_MODE,
      attributes: sheet?.attributes ?? EMPTY_ATTRS,
    };
  }

  // -------------------------
  // Private state (caches)
  // -------------------------

  private readonly _sheetTextCache: Map<SpriteSheetUrl, string> = new Map<SpriteSheetUrl, string>();
  private readonly _sheetRequestCache: Map<SpriteSheetUrl, Promise<string>> = new Map<
    SpriteSheetUrl,
    Promise<string>
  >();

  // -------------------------
  // Private helpers
  // -------------------------

  private _isBrowser(): boolean {
    return isPlatformBrowser(this._platformId);
  }

  private async _loadSheet(url: SpriteSheetUrl): Promise<string> {
    const cachedText: string | undefined = this._sheetTextCache.get(url);
    if (cachedText !== undefined) {
      return cachedText;
    }

    const inflight: Promise<string> | undefined = this._sheetRequestCache.get(url);
    if (inflight !== undefined) {
      return inflight;
    }

    const request: Promise<string> = this._fetchSheet(url)
      .then((text: string): string => {
        this._sheetTextCache.set(url, text);
        return text;
      })
      .finally((): void => {
        this._sheetRequestCache.delete(url);
      });

    this._sheetRequestCache.set(url, request);
    return request;
  }

  private async _fetchSheet(url: SpriteSheetUrl): Promise<string> {
    const request$: Observable<string> = this._http.get(url, {
      responseType: 'text' as const,
    });

    const text: string = await firstValueFrom(request$);
    return text;
  }

  private _injectSymbolsFromSheets(
    contents: readonly string[],
    sheets: readonly SpriteSheetConfig[]
  ): void {
    const svgNs: string = 'http://www.w3.org/2000/svg';
    const parser: DOMParser = new DOMParser();

    const host: HTMLElement = this._getOrCreateHost();
    const rootSvg: SVGSVGElement = this._getOrCreateHostSvg(host, svgNs);

    for (let index: number = 0; index < contents.length; index++) {
      const sheetText: string = contents[index];
      const sheet: SpriteSheetConfig = sheets[index];

      const parsedDoc: Document = parser.parseFromString(sheetText, 'image/svg+xml');
      const symbols: NodeListOf<SVGSymbolElement> = parsedDoc.querySelectorAll('symbol');

      symbols.forEach((symbol: SVGSymbolElement): void => {
        const originalId: string | null = symbol.getAttribute('id');
        if (originalId === null || originalId.length === 0) {
          return;
        }

        const finalId: string =
          sheet.name !== undefined ? `${sheet.name}:${originalId}` : originalId;

        if (this._mergedSymbolIds.has(finalId)) {
          return;
        }

        const cloned: SVGSymbolElement = this._document.importNode(symbol, true);
        cloned.setAttribute('id', finalId);

        this._mergedSymbolIds.add(finalId);
        rootSvg.appendChild(cloned);

        this._mergedSymbolIds.add(finalId);
        rootSvg.appendChild(cloned);
      });
    }
  }

  private _getOrCreateHost(): HTMLElement {
    const existing: HTMLElement | null = this._document.getElementById(this._hostId);
    if (existing !== null) {
      return existing;
    }

    const host: HTMLDivElement = this._document.createElement('div');
    host.id = this._hostId;
    host.style.display = 'none';

    const body: HTMLElement | null = this._document.body;
    body.prepend(host);

    return host;
  }

  private _getOrCreateHostSvg(host: HTMLElement, svgNs: string): SVGSVGElement {
    const existingSvg: Element | null = host.querySelector('svg');
    if (existingSvg instanceof SVGSVGElement) {
      return existingSvg;
    }

    const svg: SVGSVGElement = this._document.createElementNS(svgNs, 'svg') as SVGSVGElement;
    svg.setAttribute('xmlns', svgNs);
    svg.setAttribute('style', 'display:none;');

    host.appendChild(svg);
    return svg;
  }

  private _normalizeSheets(sheets: readonly SpriteSheetConfig[]): SpriteSheetConfig[] {
    return sheets.map((sheet: SpriteSheetConfig): SpriteSheetConfig => this._normalizeSheet(sheet));
  }

  private _normalizeSheet(sheet: SpriteSheetConfig): SpriteSheetConfig {
    const normalizedName: string = (sheet.name ?? '').trim();
    const normalizedPath: string = sheet.path.trim();

    return {
      path: normalizedPath,
      name: normalizedName.length > 0 ? normalizedName : undefined,
      mode: sheet.mode ?? DEFAULT_MODE,
      attributes: sheet.attributes ?? EMPTY_ATTRS,
    };
  }

  private _parseSymbolRef(ref: string): { sheetName: string | null; symbolId: string } {
    const colonIndex: number = ref.indexOf(':');
    if (colonIndex <= 0) {
      return { sheetName: null, symbolId: ref };
    }

    const sheetName: string = ref.slice(0, colonIndex).trim();
    const iconName: string = ref.slice(colonIndex + 1).trim();

    if (sheetName.length === 0 || iconName.length === 0) {
      return { sheetName: null, symbolId: ref };
    }

    return { sheetName, symbolId: `${sheetName}:${iconName}` };
  }
}
