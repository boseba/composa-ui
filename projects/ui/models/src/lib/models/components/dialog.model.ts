import { inject } from '@angular/core';
import { type Observable, Subject } from 'rxjs';
import { DIALOG_DATA, DIALOG_REF } from '../..';

export interface DialogOptions<TData = unknown> {
  data?: TData;
  closeOnOutsideClick?: boolean;
  closeOnEsc?: boolean;
  backdrop?: boolean;
}

export class DialogRef<TResult = unknown> {
  private readonly _afterClosedSubject: Subject<TResult | undefined> = new Subject<
    TResult | undefined
  >();
  private _isClosed = false;

  public get afterClosed$(): Observable<TResult | undefined> {
    return this._afterClosedSubject.asObservable();
  }

  public get isClosed(): boolean {
    return this._isClosed;
  }

  public close(result?: TResult): void {
    if (this._isClosed) {
      return;
    }

    this._isClosed = true;
    this._afterClosedSubject.next(result);
    this._afterClosedSubject.complete();
  }
}

export abstract class DialogContentBase<TData = unknown, TResult = unknown> {
  protected readonly dialogRef: DialogRef<TResult> = inject(DIALOG_REF) as DialogRef<TResult>;
  protected readonly data: TData = inject(DIALOG_DATA) as TData;

  public close(result?: TResult): void {
    this.dialogRef.close(result);
  }
}
