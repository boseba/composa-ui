import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'composa-dialog-content',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './composa-dialog-content.html',
  styleUrl: './composa-dialog-content.scss',
})
export class DialogContent {}
