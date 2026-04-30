import type { ComponentRef } from '@angular/core';
import { type DialogOptions, type DialogRef } from '@composa/ui/models';
import { type DialogContainer } from '../components';

export interface DialogInstance<TResult = unknown, TData = unknown> {
  id: string;
  ref: DialogRef<TResult>;
  options: Required<DialogOptions<TData>>;
  containerRef: ComponentRef<DialogContainer>;
  previouslyFocusedElement: HTMLElement | null;
}

export class DialogScrollLock {
  private _lockCount = 0;
  private _previousOverflow = '';

  public lock(): void {
    this._lockCount += 1;

    if (this._lockCount !== 1) {
      return;
    }

    const body = document.body;
    this._previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
  }

  public unlock(): void {
    if (this._lockCount <= 0) {
      return;
    }

    this._lockCount -= 1;

    if (this._lockCount !== 0) {
      return;
    }

    document.body.style.overflow = this._previousOverflow;
    this._previousOverflow = '';
  }
}
