import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EnvironmentInjector,
  type Injector,
  Input,
  type Type,
  ViewChild,
  ViewContainerRef,
  createComponent,
  inject,
} from '@angular/core';
import { DIALOG_REF, type DialogRef } from '@composa/ui/models';

@Component({
  selector: 'composa-internal-dialog-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dialog-container.html',
  styleUrl: './dialog-container.scss',
})
export class DialogContainer {
  private readonly _environmentInjector: EnvironmentInjector = inject(EnvironmentInjector);

  @ViewChild('contentHost', { read: ViewContainerRef, static: true })
  private readonly _contentHost!: ViewContainerRef;

  @ViewChild('panel', { read: ElementRef, static: true })
  private readonly _panelElementRef!: ElementRef<HTMLElement>;

  @Input({ required: true })
  public dialogId!: string;

  @Input({ required: true })
  public backdrop = true;

  @Input({ required: true })
  public closeOnOutsideClick = true;

  @Input({ required: true })
  public contentComponent!: Type<unknown>;

  @Input({ required: true })
  public contentInjector!: Injector;

  private _pointerDownOnBackdrop = false;

  public mountContent(): void {
    this._contentHost.clear();

    const componentRef = createComponent(this.contentComponent, {
      environmentInjector: this._environmentInjector,
      elementInjector: this.contentInjector,
    });

    this._contentHost.insert(componentRef.hostView);

    // Focus management:
    // - Try autofocus element inside content
    // - Otherwise focus the panel container
    queueMicrotask(() => {
      const panelElement = this._panelElementRef.nativeElement;
      const autoFocusElement = panelElement.querySelector<HTMLElement>('[autofocus]');
      (autoFocusElement ?? panelElement).focus();
    });
  }

  public onBackdropMouseDown(event: MouseEvent): void {
    // Track that the click started on the backdrop to avoid closing when drag/select ends elsewhere.
    this._pointerDownOnBackdrop = event.button === 0;
  }

  public onBackdropClick(event: MouseEvent): void {
    if (!this.backdrop) {
      return;
    }

    if (!this.closeOnOutsideClick) {
      return;
    }

    if (!this._pointerDownOnBackdrop) {
      return;
    }

    event.stopPropagation();
    this._pointerDownOnBackdrop = false;

    const dialogRef = this._tryGetDialogRef();
    dialogRef?.close(undefined);
  }

  public onViewportClick(): void {
    // Intentionally empty.
    // We close on backdrop click only, to avoid accidental closures.
  }

  private _tryGetDialogRef(): DialogRef<unknown> | null {
    try {
      return this.contentInjector.get(DIALOG_REF, null, { optional: true });
    } catch {
      return null;
    }
  }
}
