import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  computed,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'composa-button',
  standalone: true,
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button implements AfterViewInit {
  @Input() public icon?: string;
  @Input() public type: 'button' | 'submit' | 'reset' = 'button';
  @Input() public disabled = false;

  private readonly _labelRef = viewChild.required<ElementRef<HTMLElement>>('label');
  private readonly _hasText = signal(false);

  public readonly hasIcon = computed((): boolean => (this.icon ?? '').trim().length > 0);
  public readonly hasText = computed((): boolean => this._hasText());

  public ngAfterViewInit(): void {
    this.updateHasText();
  }

  private updateHasText(): void {
    const labelElement: HTMLElement = this._labelRef().nativeElement;
    const rawText: string = (labelElement.textContent ?? '').replace(/\s+/g, '').trim();
    this._hasText.set(rawText.length > 0);
  }
}
