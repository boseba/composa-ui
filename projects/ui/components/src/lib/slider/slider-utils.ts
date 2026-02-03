export function normalizeStep(stepValue: number): number {
  return Number.isFinite(stepValue) && stepValue > 0 ? stepValue : 1;
}

export function clamp(value: number, minValue: number, maxValue: number): number {
  return Math.min(maxValue, Math.max(minValue, value));
}

export function snapToStep(
  value: number,
  minValue: number,
  maxValue: number,
  stepValue: number,
): number {
  const relative = (value - minValue) / stepValue;
  const rounded = Math.round(relative) * stepValue + minValue;

  const snapped = clamp(rounded, minValue, maxValue);

  const decimals = countDecimals(stepValue);
  return decimals > 0 ? roundToDecimals(snapped, decimals) : snapped;
}

function countDecimals(value: number): number {
  const text = String(value);
  const dotIndex = text.indexOf('.');
  return dotIndex === -1 ? 0 : text.length - dotIndex - 1;
}

function roundToDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
