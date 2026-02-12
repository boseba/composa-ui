const OVERLAY_ROOT_ID = 'composa-dialog-overlay-root';

export function ensureOverlayRootElement(): HTMLElement {
  const existing = document.getElementById(OVERLAY_ROOT_ID);
  if (existing) {
    return existing;
  }

  const root = document.createElement('div');
  root.id = OVERLAY_ROOT_ID;
  root.className = 'composa-dialog-overlay-root';
  document.body.appendChild(root);

  return root;
}

export function removeOverlayRootElementIfEmpty(): void {
  const root = document.getElementById(OVERLAY_ROOT_ID);
  if (!root) {
    return;
  }

  if (root.childElementCount === 0) {
    root.remove();
  }
}
