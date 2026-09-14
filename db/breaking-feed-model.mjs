/** Yalnız ziyaretçiye açık liste alanları; haber gövdesi ve editoryal veriler gönderilmez. */
export function toBreakingItems(articles) {
  return articles.slice(0, 5).map(({ id, slug, title, publishedAt }) => ({ id, slug, title, publishedAt }));
}

export function isBreakingItems(value) {
  return Array.isArray(value) && value.length <= 5 && new Set(value.map((item) => item?.id)).size === value.length
    && value.every((item) => item && Number.isSafeInteger(item.id) && item.id > 0 && typeof item.slug === "string" && /^[a-z0-9-]+$/.test(item.slug)
      && typeof item.title === "string" && item.title.trim().length > 0 && item.title.length <= 500
      && (item.publishedAt === null || (Number.isFinite(item.publishedAt) && item.publishedAt > 0 && item.publishedAt < 8.64e15)));
}
