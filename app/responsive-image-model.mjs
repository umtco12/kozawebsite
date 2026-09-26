export const RESPONSIVE_IMAGE_WIDTHS = Object.freeze([480, 768, 1024, 1440]);

const storedImagePattern = /^\/media\/(\d{4})\/(\d{2})\/([a-f0-9]{32})\.(?:jpe?g|png|webp)$/i;

export function responsiveImageUrl(source, width) {
  const match = storedImagePattern.exec(String(source || ""));
  if (!match || !RESPONSIVE_IMAGE_WIDTHS.includes(Number(width))) return "";
  return `/media/_variants/${match[1]}/${match[2]}/${match[3]}-${width}.webp`;
}

export function responsiveImageAttributes(source, options = {}) {
  const original = String(source || "");
  const preferredWidth = RESPONSIVE_IMAGE_WIDTHS.includes(Number(options.preferredWidth))
    ? Number(options.preferredWidth)
    : 1024;
  const src = responsiveImageUrl(original, preferredWidth);
  if (!src) return { src: original };
  return {
    src,
    srcSet: RESPONSIVE_IMAGE_WIDTHS.map((width) => `${responsiveImageUrl(original, width)} ${width}w`).join(", "),
    sizes: String(options.sizes || "100vw"),
  };
}
