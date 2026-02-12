import {
  ApplicationRef,
  EnvironmentInjector,
  Injectable,
  Injector,
  Type,
  createComponent,
  inject,
} from '@angular/core';
import {
  DialogHost,
  DialogInstance,
  DialogScrollLock,
  ensureOverlayRootElement,
  removeOverlayRootElementIfEmpty,
} from '@composa/ui/core/internal';
import {
  DIALOG_DATA,
  DIALOG_REF,
  DialogOptions,
  DialogRef,
  normalizeDialogOptions,
} from '@composa/ui/models';
import { take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DialogService {
  private readonly _applicationRef: ApplicationRef = inject(ApplicationRef);
  private readonly _environmentInjector: EnvironmentInjector = inject(EnvironmentInjector);

  private readonly _scrollLock: DialogScrollLock = new DialogScrollLock();

  private _hostRef: ReturnType<typeof createComponent<DialogHost>> | null = null;
  private _hostElement: HTMLElement | null = null;

  private _idCounter: number = 0;
  private _globalKeydownListenerBound: ((event: KeyboardEvent) => void) | null = null;

  public show<TComponent, TData = unknown, TResult = unknown>(
    component: Type<TComponent>,
    options?: DialogOptions<TData>,
  ): DialogRef<TResult> {
    if (typeof document === 'undefined') {
      throw new Error('DialogService.show() cannot be used during SSR.');
    }

    const normalizedOptions = normalizeDialogOptions(options);

    this._ensureHost();

    const dialogRef = new DialogRef<TResult>();
    const dialogId = this._nextDialogId();

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const contentInjector = Injector.create({
      providers: [
        { provide: DIALOG_REF, useValue: dialogRef },
        { provide: DIALOG_DATA, useValue: normalizedOptions.data },
      ],
      parent: this._environmentInjector,
    });

    const zIndex = this._computeZIndex();

    const effectiveCloseOnOutsideClick = normalizedOptions.backdrop
      ? normalizedOptions.closeOnOutsideClick
      : false;

    const hostInstance = this._hostRef!.instance;
    const containerRef = hostInstance.createDialogContainer(
      dialogId,
      zIndex,
      normalizedOptions.backdrop,
      effectiveCloseOnOutsideClick,
      component as unknown as Type<unknown>,
      contentInjector,
    );

    const instance: DialogInstance<TResult, TData> = {
      id: dialogId,
      ref: dialogRef,
      options: normalizedOptions,
      containerRef,
      previouslyFocusedElement,
    };

    hostInstance.registerInstance(instance as unknown as DialogInstance);
    this._scrollLock.lock();
    this._ensureGlobalEscListener();

    dialogRef.afterClosed$.pipe(take(1)).subscribe(() => {
      this._disposeDialog(instance as unknown as DialogInstance);
    });

    return dialogRef;
  }

  private _ensureHost(): void {
    if (this._hostRef && this._hostElement) {
      return;
    }

    const overlayRoot = ensureOverlayRootElement();

    const hostRef = createComponent(DialogHost, {
      environmentInjector: this._environmentInjector,
    });

    this._applicationRef.attachView(hostRef.hostView);

    const hostElement = hostRef.location.nativeElement as HTMLElement;
    overlayRoot.appendChild(hostElement);

    hostRef.instance.attachToElement(overlayRoot);

    this._hostRef = hostRef;
    this._hostElement = hostElement;
  }

  private _nextDialogId(): string {
    this._idCounter += 1;
    return `composa-dialog-${this._idCounter}`;
  }

  private _computeZIndex(): number {
    const baseZIndex = 1000;
    const stackSize = this._hostRef?.instance.instances.length ?? 0;
    return baseZIndex + stackSize * 2;
  }

  private _ensureGlobalEscListener(): void {
    if (this._globalKeydownListenerBound) {
      return;
    }

    this._globalKeydownListenerBound = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      const topInstance = this._getTopInstance();
      if (!topInstance || !topInstance.options.closeOnEsc) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      topInstance.ref.close(undefined);
    };

    document.addEventListener('keydown', this._globalKeydownListenerBound, { capture: true });
  }

  private _removeGlobalEscListenerIfUnused(): void {
    if (!this._globalKeydownListenerBound) {
      return;
    }

    const hasDialogs = (this._hostRef?.instance.instances.length ?? 0) > 0;
    if (hasDialogs) {
      return;
    }

    document.removeEventListener('keydown', this._globalKeydownListenerBound, {
      capture: true,
    } as AddEventListenerOptions);
    this._globalKeydownListenerBound = null;
  }

  private _getTopInstance(): DialogInstance | null {
    const instances = this._hostRef?.instance.instances ?? [];
    return instances.length > 0 ? (instances[instances.length - 1] ?? null) : null;
  }

  private _disposeDialog(instance: DialogInstance): void {
    const hostInstance = this._hostRef?.instance;
    if (!hostInstance) {
      return;
    }

    hostInstance.unregisterInstance(instance.id);

    this._applicationRef.detachView(instance.containerRef.hostView);
    instance.containerRef.destroy();

    this._scrollLock.unlock();

    queueMicrotask(() => {
      instance.previouslyFocusedElement?.focus();
    });

    this._removeGlobalEscListenerIfUnused();

    queueMicrotask(() => {
      removeOverlayRootElementIfEmpty();
    });
  }
}
