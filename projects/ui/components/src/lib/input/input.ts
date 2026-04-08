import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';

import type { ControlAction, InputSize, InputType } from '@composa/ui/models';
import { Button } from '../button/button';
import { Icon } from '../icon/icon';

@Component({
  selector: 'composa-input',
  standalone: true,
  imports: [Icon, Button],
  templateUrl: './input.html',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
  host: {
    '[class.disabled]': 'isDisabled()',
    '[attr.cmp-size]': 'size()',
  },
})
export class Input implements ControlValueAccessor {
  public readonly size = input<InputSize>('medium');
  public readonly icon = input<string>('');
  public readonly placeholder = input<string>('');
  public readonly type = input<InputType>('text');
  public readonly disabled = input<boolean>(false);

  public readonly actions = input<ReadonlyArray<ControlAction>>([]);

  public readonly value = input<string>('');
  public readonly valueChange = output<string>();
  public readonly blurred = output<void>();

  public readonly hasButtons: Signal<boolean> = computed((): boolean => {
    return this.actions().length > 0;
  });

  public readonly hasIcon: Signal<boolean> = computed((): boolean => {
    return this.icon().trim().length > 0;
  });

  public readonly hasValue: Signal<boolean> = computed((): boolean => {
    return this._internalValue().trim().length > 0;
  });

  private readonly _formsDisabled = signal<boolean>(false);

  public readonly isDisabled: Signal<boolean> = computed((): boolean => {
    return this.disabled() || this._formsDisabled();
  });

  private readonly _internalValue = signal<string>('');

  private _onChange: (value: string) => void = () => {};
  private _onTouched: () => void = () => {};

  private _isWritingFromOutside: boolean = false;

  private readonly _inputRef = viewChild.required<ElementRef<HTMLInputElement>>('input');

  public constructor() {
    effect((): void => {
      const externalValue = this.value();

      if (this._isWritingFromOutside) {
        return;
      }

      this._internalValue.set(externalValue ?? '');
    });
  }

  public onEnter(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const form = target.form;

    if (!form) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    form.requestSubmit();
  }

  public onActionClick(action: ControlAction, event: MouseEvent): void {
    event.stopPropagation();

    if (this.disabled() || action.disabled === true) {
      event.preventDefault();
      return;
    }

    void action.click(event);
  }

  public get renderedValue(): string {
    return this._internalValue();
  }

  public focus(): void {
    if (this.isDisabled()) {
      return;
    }

    this._inputRef().nativeElement.focus();
  }

  public focusAndSelect(): void {
    if (this.isDisabled()) {
      return;
    }

    const inputElement: HTMLInputElement = this._inputRef().nativeElement;
    inputElement.focus();
    inputElement.select();
  }

  public onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const nextValue = target.value;

    this._internalValue.set(nextValue);
    this._onChange(nextValue);
    this.valueChange.emit(nextValue);
  }

  public onBlur(): void {
    this._onTouched();
    this.blurred.emit();
  }

  public writeValue(value: unknown): void {
    this._isWritingFromOutside = true;
    this._internalValue.set(typeof value === 'string' ? value : '');
    this._isWritingFromOutside = false;
  }

  public registerOnChange(fn: (value: string) => void): void {
    this._onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  public setDisabledState(isDisabled: boolean): void {
    this._formsDisabled.set(isDisabled);
  }

  public getActionAriaLabel(action: ControlAction): string {
    const tooltip = action.tooltip?.trim();

    if (tooltip && tooltip.length > 0) {
      return tooltip;
    }

    return action.icon;
  }
}
