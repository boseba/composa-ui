import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { type ControlAction } from '@composa/ui/models';

export type TagActionVisibility = 'hover' | 'always';

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

  public readonly actions = input<readonly ControlAction[]>([]);
  public readonly actionVisibility = input<TagActionVisibility>('hover');

  public onActionClick(action: ControlAction, event: MouseEvent): void {
    event.stopPropagation();

    if (this.disabled() || action.disabled === true) {
      event.preventDefault();
      return;
    }

    void action.click(event);
  }

  public getActionAriaLabel(action: ControlAction): string {
    const tooltip = action.tooltip?.trim();
    if (tooltip && tooltip.length > 0) {
      return tooltip;
    }

    return action.icon;
  }
}
