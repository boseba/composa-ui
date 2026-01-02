import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  Injector,
  input,
  runInInjectionContext,
  type Signal,
  signal,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import type { ResolvedIcon } from '@composa/ui/core/internal';
import type { IconAttributes, IconRenderMode } from '@composa/ui/models';
import { IconRegistryService } from '@composa/ui/services';

@Component({
  selector: 'composa-icon',
  standalone: true,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  /**
   * Icon reference to resolve from the registry ("#<icon-name>", "#<set name>:<icon-name>").
   */
  public readonly name = input.required<string>();

  /**
   * Accessible label for the icon.
   * When omitted, the icon is treated as decorative.
   */
  public readonly ariaLabel = input<string | undefined>(undefined);

  private readonly _registry: IconRegistryService = inject(IconRegistryService);
  private readonly _injector: Injector = inject(Injector);

  private readonly _svgRef: Signal<ElementRef<SVGSVGElement>> =
    viewChild.required<ElementRef<SVGSVGElement>>('svg');

  private readonly _isViewReady: WritableSignal<boolean> = signal<boolean>(false);

  protected readonly resolved: Signal<ResolvedIcon | null> = computed((): ResolvedIcon | null =>
    this._registry.resolve(this.name())
  );

  protected readonly href: Signal<string | null> = computed((): string | null => {
    const resolvedIcon: ResolvedIcon | null = this.resolved();
    return resolvedIcon?.href ?? null;
  });

  constructor() {
    afterNextRender((): void => {
      this._isViewReady.set(true);
    });

    runInInjectionContext(this._injector, (): void => {
      effect((): void => {
        if (!this._isViewReady()) {
          return;
        }

        const svgElement: SVGSVGElement = this._svgRef().nativeElement;
        const resolvedIcon: ResolvedIcon | null = this.resolved();

        this._applyMode(svgElement, resolvedIcon?.mode);
        this._applyAttributes(svgElement, resolvedIcon?.attributes);
      });
    });
  }

  private _applyMode(svgElement: SVGSVGElement, mode: IconRenderMode | undefined): void {
    const effectiveMode: IconRenderMode = mode ?? 'stroke';

    if (effectiveMode === 'stroke') {
      svgElement.setAttribute('fill', 'none');
      svgElement.setAttribute('stroke', 'currentColor');
      return;
    }

    svgElement.setAttribute('fill', 'currentColor');
    svgElement.removeAttribute('stroke');
  }

  private _applyAttributes(
    svgElement: SVGSVGElement,
    attributes: IconAttributes | undefined
  ): void {
    svgElement.removeAttribute('stroke-width');
    svgElement.removeAttribute('stroke-linecap');
    svgElement.removeAttribute('stroke-linejoin');

    if (attributes === undefined) {
      return;
    }

    const strokeWidth: string = attributes['stroke-width'];
    const strokeWidthValue: string = strokeWidth.trim();
    if (strokeWidthValue.length > 0) {
      svgElement.setAttribute('stroke-width', strokeWidthValue);
    }

    const strokeLinecap: string = attributes['stroke-linecap'];
    const strokeLinecapValue: string = strokeLinecap.trim();
    if (strokeLinecapValue.length > 0) {
      svgElement.setAttribute('stroke-linecap', strokeLinecapValue);
    }

    const strokeLinejoin: string = attributes['stroke-linejoin'];
    const strokeLinejoinValue: string = strokeLinejoin.trim();
    if (strokeLinejoinValue.length > 0) {
      svgElement.setAttribute('stroke-linejoin', strokeLinejoinValue);
    }
  }
}
