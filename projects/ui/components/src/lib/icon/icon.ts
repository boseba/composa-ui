import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  type Signal,
  signal,
  untracked,
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
  public readonly name = input.required<string>();
  public readonly ariaLabel = input<string | undefined>(undefined);

  private readonly _registry: IconRegistryService = inject(IconRegistryService);

  private readonly _svgRef: Signal<ElementRef<SVGSVGElement>> =
    viewChild.required<ElementRef<SVGSVGElement>>('svg');

  private readonly _isViewReady: WritableSignal<boolean> = signal<boolean>(false);

  protected readonly resolved: Signal<ResolvedIcon | null> = computed((): ResolvedIcon | null =>
    this._registry.resolve(this.name()),
  );

  protected readonly href: Signal<string | null> = computed((): string | null => {
    const resolvedIcon: ResolvedIcon | null = this.resolved();
    return resolvedIcon?.href ?? null;
  });

  constructor() {
    afterNextRender((): void => {
      this._isViewReady.set(true);
    });

    effect((): void => {
      if (!this._isViewReady()) {
        return;
      }

      const resolvedIcon: ResolvedIcon | null = this.resolved();

      untracked((): void => {
        const svgElement: SVGSVGElement = this._svgRef().nativeElement;
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
    attributes: IconAttributes | undefined,
  ): void {
    svgElement.removeAttribute('stroke-width');
    svgElement.removeAttribute('stroke-linecap');
    svgElement.removeAttribute('stroke-linejoin');

    if (attributes === undefined) {
      return;
    }

    for (const [key, value] of Object.entries(attributes)) {
      const normalizedValue: string = value.trim();
      if (normalizedValue.length > 0) {
        svgElement.setAttribute(key, normalizedValue);
      }
    }
  }
}
