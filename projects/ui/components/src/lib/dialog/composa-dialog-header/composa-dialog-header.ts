import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import type { DialogRef } from '@composa/ui/models';
import { DIALOG_REF } from '@composa/ui/models';

@Component({
  selector: 'composa-dialog-header',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './composa-dialog-header.html',
  styleUrl: './composa-dialog-header.scss',
})
export class DialogHeader {
  private readonly _dialogRef: DialogRef<unknown> | null = inject(DIALOG_REF, { optional: true });

  @Input()
  public title = '';

  @Input()
  public context = '';

  @Input()
  public closeButton = false;

  public get canClose(): boolean {
    return !!this._dialogRef;
  }

  public onCloseClicked(): void {
    this._dialogRef?.close(undefined);
  }
}
