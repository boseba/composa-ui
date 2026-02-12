import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { DialogRef } from '@composa/ui/models/lib/models/components/dialog.model';
import { DIALOG_REF } from '@composa/ui/models/lib/types/components/dialog.type';

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
  public title: string = '';

  @Input()
  public context: string = '';

  @Input()
  public closeButton: boolean = false;

  public get canClose(): boolean {
    return !!this._dialogRef;
  }

  public onCloseClicked(): void {
    this._dialogRef?.close(undefined);
  }
}
