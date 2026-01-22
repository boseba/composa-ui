import { isPlatformBrowser } from '@angular/common';
import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  isDevMode,
  type OnDestroy,
  PLATFORM_ID,
  signal,
  type Signal,
  viewChild,
} from '@angular/core';
import type {
  ButtonShape,
  ButtonSize,
  ButtonTone,
  ButtonType,
  ButtonVariant,
} from '@composa/ui/models';
import { Icon } from '../icon/icon';

@Component({
  selector: 'composa-button',
  standalone: true,
  imports: [Icon],
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-shape]': 'effectiveShape()',
    '[attr.data-size]': 'size()',
  },
})
export class Button implements AfterViewInit, OnDestroy {
  /**
   * Visual variant of the button.
   */
  public readonly variant = input<ButtonVariant>('solid');

  /**
   * Color intent of the button.
   */
  public readonly tone = input<ButtonTone>('primary');

  /**
   * Shape of the button.
   */
  public readonly shape = input<ButtonShape>('rounded');

  public readonly effectiveShape = computed((): ButtonShape => {
    const requestedShape: ButtonShape = this.shape();

    if (requestedShape !== 'round') {
      return requestedShape;
    }

    // "round" is only meaningful for icon-only buttons
    const isIconOnly: boolean = this.hasIcon() && !this.hasText();
    return isIconOnly ? 'round' : 'rounded';
  });

  /**
   * Size of the button.
   */
  public readonly size = input<ButtonSize>('medium');

  /**
   * Optional icon name to render before the label.
   * When empty (default), no icon is rendered.
   */
  public readonly icon = input<string>('');

  /**
   * Accessible label for icon-only buttons.
   * When the button has visible text content, this attribute is omitted.
   */
  public readonly ariaLabel = input<string | undefined>(undefined);

  /**
   * Native button type.
   * Defaults to `"button"` to prevent unintended form submissions.
   */
  public readonly type = input<ButtonType>('button');

  /**
   * Disables the button when set to `true`.
   */
  public readonly disabled = input<boolean>(false);

  /**
   * Whether the button currently has an icon.
   */
  public readonly hasIcon: Signal<boolean> = computed((): boolean => {
    return this.icon().trim().length > 0;
  });

  /**
   * Whether the button currently has projected text content.
   */
  public readonly hasText: Signal<boolean> = computed((): boolean => {
    return this._hasText();
  });

  /**
   * Effective aria-label to apply on the host button element.
   * - If the button has visible text, aria-label is omitted (null).
   * - If the button is icon-only, aria-label is applied when provided.
   */
  public readonly effectiveAriaLabel: Signal<string | null> = computed((): string | null => {
    if (this.hasText()) {
      return null;
    }

    const rawLabel: string | undefined = this.ariaLabel();
    const normalizedLabel: string = (rawLabel ?? '').trim();

    return normalizedLabel.length > 0 ? normalizedLabel : null;
  });

  private readonly _platformId: object = inject(PLATFORM_ID);

  private readonly _labelRef: Signal<ElementRef<HTMLElement>> =
    viewChild.required<ElementRef<HTMLElement>>('label');

  private readonly _hasText = signal<boolean>(false);

  private _textObserver: MutationObserver | null = null;

  public ngAfterViewInit(): void {
    this._refreshHasText();
    this._setupLabelObserver();
    this._warnIfIconOnlyWithoutAriaLabel();
  }

  public ngOnDestroy(): void {
    this._textObserver?.disconnect();
    this._textObserver = null;
  }

  private _setupLabelObserver(): void {
    if (!isPlatformBrowser(this._platformId)) {
      return;
    }

    const labelElement: HTMLElement = this._labelRef().nativeElement;

    this._textObserver = new MutationObserver((): void => {
      this._refreshHasText();
      this._warnIfIconOnlyWithoutAriaLabel();
    });

    this._textObserver.observe(labelElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private _refreshHasText(): void {
    const labelElement: HTMLElement = this._labelRef().nativeElement;
    const textContent: string = labelElement.textContent;
    const condensedText: string = textContent.replace(/\s/g, '');

    this._hasText.set(condensedText.length > 0);
  }

  private _warnIfIconOnlyWithoutAriaLabel(): void {
    if (!isDevMode()) {
      return;
    }

    const isIconOnly: boolean = this.hasIcon() && !this.hasText();
    const hasEffectiveLabel: boolean = this.effectiveAriaLabel() !== null;

    if (isIconOnly && !hasEffectiveLabel) {
      console.warn(
        '[composa-button] Icon-only buttons should provide `ariaLabel` for accessibility.',
      );
    }
  }
}
