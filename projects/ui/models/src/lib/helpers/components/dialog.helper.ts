import { DialogOptions } from '../../models';

export function normalizeDialogOptions<TData>(
  options?: DialogOptions<TData>,
): Required<DialogOptions<TData>> {
  return {
    data: options?.data as TData,
    closeOnOutsideClick: options?.closeOnOutsideClick ?? true,
    closeOnEsc: options?.closeOnEsc ?? true,
    backdrop: options?.backdrop ?? true,
  };
}
