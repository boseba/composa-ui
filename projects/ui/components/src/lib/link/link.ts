import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input as defineInput,
  output as defineOutput,
} from '@angular/core';

type LinkUnderline = 'always' | 'hover' | 'never';

@Component({
  selector: 'composa-link',
  standalone: true,
  templateUrl: './link.html',
  styleUrls: ['./link.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Link {
  public readonly url = defineInput<string | null>(null);
  public readonly target = defineInput<string | null>(null);
  public readonly rel = defineInput<string | null>(null);

  public readonly title = defineInput<string | null>(null);
  public readonly ariaLabel = defineInput<string | null>(null);

  public readonly download = defineInput<string | boolean | null>(null);
  public readonly disabled = defineInput<boolean>(false);

  public readonly underline = defineInput<LinkUnderline>('hover');

  public readonly activated = defineOutput<MouseEvent>();

  public readonly effectiveRel = computed<string | null>(() => {
    const explicitRel = this.rel();
    if (explicitRel && explicitRel.trim().length > 0) {
      return explicitRel;
    }

    const target = this.target();
    if (target === '_blank') {
      return 'noopener noreferrer';
    }

    return null;
  });

  public readonly downloadAttr = computed<string | null>(() => {
    const value = this.download();
    if (value === null || value === false) {
      return null;
    }

    if (value === true) {
      return '';
    }

    return value;
  });

  public onClick(event: MouseEvent): void {
    if (this.disabled()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.activated.emit(event);
  }
}
