export const MIN_MEDIA_WIDTH = 120;
export function clampMediaWidth(value, available) {
  const max = Math.max(1, Math.floor(Number(available) || MIN_MEDIA_WIDTH));
  return Math.max(Math.min(MIN_MEDIA_WIDTH, max), Math.min(Math.round(Number(value) || MIN_MEDIA_WIDTH), max));
}
/** @returns {Record<string, string>} */
export function mediaWidthAttributes(value) {
  const width = Math.round(Number(value));
  return Number.isFinite(width) && width > 0 && width <= 4096 ? { width: String(width), style: `width:${width}px;max-width:100%;height:auto` } : {};
}
