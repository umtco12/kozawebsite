const allowedImage = /^(?:\/media\/|\/news\/|https:\/\/)/i;
const placeholderImage = /\/news\/gorsel-yok\.svg(?:$|\?)/i;

export function extractGalleryImages(article) {
  const images = [];
  const seen = new Set();
  const add = (src, caption = "") => {
    const value = String(src ?? "").trim();
    if (!value || !allowedImage.test(value) || placeholderImage.test(value) || seen.has(value)) return;
    seen.add(value);
    images.push({ src: value, caption: String(caption ?? "").trim().slice(0, 300) });
  };

  add(article?.heroImage, article?.imageAlt);
  for (const block of Array.isArray(article?.blocks) ? article.blocks : []) {
    if (block?.type === "image") add(block.content, block.caption);
  }
  return images;
}

export function selectPhotoGalleries(articles, limit = 24) {
  const safeLimit = Math.min(Math.max(Number(limit) || 1, 1), 48);
  return (Array.isArray(articles) ? articles : [])
    .map((article) => ({ ...article, galleryImages: extractGalleryImages(article) }))
    .filter((article) => article.galleryImages.length > 0)
    .slice(0, safeLimit);
}
