import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input as defineInput,
  output as defineOutput,
  ElementRef,
  forwardRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { clamp, normalizeStep, snapToStep } from './slider-utils';

type SliderOrientation = 'horizontal' | 'vertical';

@Component({
  selector: 'composa-slider',
  standalone: true,
  templateUrl: './slider.html',
  styleUrls: ['./slider.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Slider),
      multi: true,
    },
  ],
})
export class Slider implements ControlValueAccessor {
  public readonly min = defineInput<number>(0);
  public readonly max = defineInput<number>(100);
  public readonly step = defineInput<number>(1);

  public readonly disabled = defineInput<boolean>(false);
  public readonly orientation = defineInput<SliderOrientation>('horizontal');

  public readonly value = defineInput<number | null>(null);
  public readonly valueChange = defineOutput<number>();

  public readonly valueInput = defineOutput<number>();
  public readonly valueCommit = defineOutput<number>();
  public readonly focused = defineOutput<void>();
  public readonly blurred = defineOutput<void>();

  private readonly _nativeInputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('nativeRange');
  private readonly _trackRef = viewChild.required<ElementRef<HTMLElement>>('track');

  private readonly _currentValue = signal<number>(0);
  private readonly _dragging = signal<boolean>(false);
  private readonly _formsDisabled = signal<boolean>(false);

  private _activePointerId: number | null = null;
  private _cachedTrackRect: DOMRect | null = null;

  private _onChange: (value: number) => void = () => {};
  private _onTouched: () => void = () => {};

  public readonly effectiveDisabled = computed<boolean>(() => {
    return this.disabled() || this._formsDisabled();
  });

  public readonly dragging = computed<boolean>(() => this._dragging());

  public readonly currentValue = computed<number>(() => this._currentValue());

  public readonly percent = computed<number>(() => {
    const minValue = this.min();
    const maxValue = this.max();
    const range = Math.max(1e-9, maxValue - minValue);

    const value = clamp(this._currentValue(), minValue, maxValue);
    return (value - minValue) / range;
  });

  public constructor() {
    const incoming = this.value();
    if (incoming !== null && Number.isFinite(incoming)) {
      this._setValue(incoming, { emit: false, commit: false });
    }
  }

  public writeValue(value: unknown): void {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) {
      return;
    }
    this._setValue(numeric, { emit: false, commit: false });
  }

  public registerOnChange(onChange: (value: number) => void): void {
    this._onChange = onChange;
  }

  public registerOnTouched(onTouched: () => void): void {
    this._onTouched = onTouched;
  }

  public setDisabledState(isDisabled: boolean): void {
    this._formsDisabled.set(isDisabled);
  }

  public onNativeInput(): void {
    if (this.effectiveDisabled()) {
      return;
    }

    const raw = Number(this._nativeInputRef().nativeElement.value);
    if (!Number.isFinite(raw)) {
      return;
    }

    this._setValue(raw, { emit: true, commit: false });
  }

  public onNativeChange(): void {
    if (this.effectiveDisabled()) {
      return;
    }

    const raw = Number(this._nativeInputRef().nativeElement.value);
    if (!Number.isFinite(raw)) {
      return;
    }

    this._setValue(raw, { emit: true, commit: true });
  }

  public onNativeFocus(): void {
    this.focused.emit();
  }

  public onNativeBlur(): void {
    this._markTouched();
    this.blurred.emit();
  }

  public onTrackPointerDown(event: PointerEvent): void {
    if (this.effectiveDisabled() || event.button !== 0) {
      return;
    }

    this._nativeInputRef().nativeElement.focus();
    this._startDrag(event);
    this._updateFromPointer(event, { commit: false });
  }

  public onThumbPointerDown(event: PointerEvent): void {
    if (this.effectiveDisabled() || event.button !== 0) {
      return;
    }

    this._nativeInputRef().nativeElement.focus();
    this._startDrag(event);
    event.preventDefault();
  }

  public onHostPointerMove(event: PointerEvent): void {
    if (!this._dragging() || this._activePointerId !== event.pointerId) {
      return;
    }

    this._updateFromPointer(event, { commit: false });
  }

  public onHostPointerUp(event: PointerEvent): void {
    if (!this._dragging() || this._activePointerId !== event.pointerId) {
      return;
    }

    this._updateFromPointer(event, { commit: true });
    this._endDrag();
  }

  public onHostPointerCancel(event: PointerEvent): void {
    if (!this._dragging() || this._activePointerId !== event.pointerId) {
      return;
    }

    this._endDrag();
  }

  private _startDrag(event: PointerEvent): void {
    this._activePointerId = event.pointerId;
    this._dragging.set(true);
    this._cachedTrackRect = this._trackRef().nativeElement.getBoundingClientRect();

    try {
      (inject(ElementRef) as ElementRef<HTMLElement>).nativeElement.setPointerCapture(
        event.pointerId,
      );
    } catch {
      // Ignore if capture fails.
    }

    event.preventDefault();
  }

  private _endDrag(): void {
    this._dragging.set(false);
    this._activePointerId = null;
    this._cachedTrackRect = null;
    this._markTouched();
  }

  private _updateFromPointer(event: PointerEvent, options: { commit: boolean }): void {
    const rect = this._cachedTrackRect ?? this._trackRef().nativeElement.getBoundingClientRect();
    const nextValue = this._valueFromPointer(event, rect);
    this._setValue(nextValue, { emit: true, commit: options.commit });
  }

  private _valueFromPointer(event: PointerEvent, rect: DOMRect): number {
    const minValue = this.min();
    const maxValue = this.max();
    const range = maxValue - minValue;

    if (range <= 0) {
      return minValue;
    }

    if (this.orientation() === 'vertical') {
      const offsetY = event.clientY - rect.top;
      const p = 1 - clamp(offsetY / Math.max(1, rect.height), 0, 1);
      return minValue + p * range;
    }

    const offsetX = event.clientX - rect.left;
    const p = clamp(offsetX / Math.max(1, rect.width), 0, 1);
    return minValue + p * range;
  }

  private _setValue(rawValue: number, options: { emit: boolean; commit: boolean }): void {
    const minValue = this.min();
    const maxValue = this.max();
    const stepValue = normalizeStep(this.step());

    const nextValue = snapToStep(
      clamp(rawValue, minValue, maxValue),
      minValue,
      maxValue,
      stepValue,
    );

    if (nextValue === this._currentValue()) {
      return;
    }

    this._currentValue.set(nextValue);

    if (!options.emit) {
      return;
    }

    this._onChange(nextValue);
    this.valueChange.emit(nextValue);
    this.valueInput.emit(nextValue);

    if (options.commit) {
      this.valueCommit.emit(nextValue);
    }
  }

  private _markTouched(): void {
    this._onTouched();
  }
}
