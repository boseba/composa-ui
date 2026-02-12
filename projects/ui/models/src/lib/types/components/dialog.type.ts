import { InjectionToken } from '@angular/core';
import type { DialogRef } from '../../models';

export const DIALOG_DATA = new InjectionToken<unknown>('COMPOSA_DIALOG_DATA');
export const DIALOG_REF = new InjectionToken<DialogRef<unknown>>('COMPOSA_DIALOG_REF');
