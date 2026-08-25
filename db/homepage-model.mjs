/* Ana sayfa manşeti için saf seçim kuralları.
   Eski/sabitlenmiş demo kayıtları güncel arşivin önüne geçmemeli; görseli olmayan
   haberler de gerçek görselli alternatifler varken manşetin ilk sırasına çıkmamalı. */

const MISSING_IMAGE = "/news/gorsel-yok.svg";

/** @typedef {{ id: number | string, heroImage?: string }} HomepageArticle */

/** @param {HomepageArticle} article */
function hasLeadImage(article) {
  return Boolean(article?.heroImage && article.heroImage !== MISSING_IMAGE);
}

/**
 * @template {HomepageArticle} T
 * @param {{ featured?: T[], latest?: T[], limit?: number, recentWindow?: number }} [options]
 * @returns {T[]}
 */
export function selectHomepageLeads({ featured = [], latest = [], limit = 5, recentWindow = 40 } = {}) {
  const safeLimit = Math.max(1, Number(limit) || 5);
  const safeWindow = Math.max(safeLimit, Number(recentWindow) || 40);
  const recent = latest.slice(0, safeWindow);
  const recentIds = new Set(recent.map((article) => article.id));
  const eligibleFeatured = latest.length
    ? featured.filter((article) => recentIds.has(article.id))
    : featured;
  /** @type {T[]} */
  const selected = [];
  const selectedIds = new Set();

  function add(articles, requireImage) {
    for (const article of articles) {
      if (selected.length >= safeLimit) break;
      if (!article || selectedIds.has(article.id)) continue;
      if (requireImage && !hasLeadImage(article)) continue;
      selected.push(article);
      selectedIds.add(article.id);
    }
  }

  add(eligibleFeatured, true);
  add(recent, true);
  add(eligibleFeatured, false);
  add(recent, false);

  return selected;
}
