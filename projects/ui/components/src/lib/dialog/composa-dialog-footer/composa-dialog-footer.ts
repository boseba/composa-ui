import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'composa-dialog-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './composa-dialog-footer.html',
  styleUrl: './composa-dialog-footer.scss',
})
export class DialogFooter {}
