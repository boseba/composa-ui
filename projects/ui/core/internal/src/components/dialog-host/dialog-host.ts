import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  EnvironmentInjector,
  type Injector,
  type Type,
  createComponent,
  inject,
} from '@angular/core';
import { type DialogInstance } from '../../models';
import { DialogContainer } from '../dialog-container/dialog-container';

@Component({
  selector: 'composa-internal-dialog-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class DialogHost {
  private readonly _applicationRef: ApplicationRef = inject(ApplicationRef);
  private readonly _environmentInjector: EnvironmentInjector = inject(EnvironmentInjector);

  private _containerElement: HTMLElement | null = null;
  private _instances: DialogInstance[] = [];

  public attachToElement(containerElement: HTMLElement): void {
    this._containerElement = containerElement;
  }

  public get instances(): readonly DialogInstance[] {
    return this._instances;
  }

  public createDialogContainer(
    dialogId: string,
    zIndex: number,
    backdrop: boolean,
    closeOnOutsideClick: boolean,
    contentComponent: Type<unknown>,
    contentInjector: Injector,
  ): ComponentRef<DialogContainer> {
    if (!this._containerElement) {
      throw new Error('DialogHostComponent is not attached to a DOM element.');
    }

    const containerRef = createComponent(DialogContainer, {
      environmentInjector: this._environmentInjector,
    });

    const hostElement = containerRef.location.nativeElement as HTMLElement;
    hostElement.style.setProperty('--composa-dialog-z-index', String(zIndex));

    containerRef.instance.dialogId = dialogId;
    containerRef.instance.backdrop = backdrop;
    containerRef.instance.closeOnOutsideClick = closeOnOutsideClick;
    containerRef.instance.contentComponent = contentComponent;
    containerRef.instance.contentInjector = contentInjector;

    this._applicationRef.attachView(containerRef.hostView);
    this._containerElement.appendChild(hostElement);

    containerRef.instance.mountContent();

    return containerRef;
  }

  public registerInstance(instance: DialogInstance): void {
    this._instances = [...this._instances, instance];
  }

  public unregisterInstance(id: string): void {
    this._instances = this._instances.filter((instance) => instance.id !== id);
  }
}
