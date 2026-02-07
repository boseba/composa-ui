import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type TagActionVisibility = 'hover' | 'always';

export interface TagAction {
  icon: string;
  tooltip?: string;
  click: (event: MouseEvent) => void;
  disabled?: boolean;
}

export interface TagActionTriggeredEvent {
  action: TagAction;
  index: number;
  originalEvent: MouseEvent;
}

@Component({
  selector: 'composa-tag',
  standalone: true,
  templateUrl: './tag.html',
  styleUrls: ['./tag.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tag {
  public readonly color = input<string | null>(null);
  public readonly disabled = input<boolean>(false);

  public readonly actions = input<ReadonlyArray<TagAction>>([]);
  public readonly actionVisibility = input<TagActionVisibility>('hover');

  public readonly actionTriggered = output<TagActionTriggeredEvent>();

  public onActionClick(action: TagAction, event: MouseEvent): void {
    event.stopPropagation();

    if (this.disabled() || action.disabled === true) {
      event.preventDefault();
      return;
    }

    action.click(event);
  }

  public getActionAriaLabel(action: TagAction): string {
    const tooltip = action.tooltip?.trim();
    if (tooltip && tooltip.length > 0) {
      return tooltip;
    }

    return action.icon;
  }
}
