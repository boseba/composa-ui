export interface ControlAction {
  icon: string;
  tooltip?: string;
  click: (event: MouseEvent) => void | Promise<void>;
  disabled?: boolean;
}
