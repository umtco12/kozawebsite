export const NEWS_SITEMAP_WINDOW_MS = 48 * 60 * 60 * 1000;
export const NEWS_SITEMAP_PAGE_SIZE = 1000;
const origin = "https://www.kozatv.com.tr";
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

export const newsSitemapHeaders = {
  "content-type": "application/xml; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
};

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char]);
}

export function parseNewsSitemapPage(value) {
  if (!/^[1-9]\d*\.xml$/.test(value)) return null;
  const page = Number(value.slice(0, -4));
  return Number.isSafeInteger(page) ? page : null;
}

/** Entries come from the published-only, 48-hour database query. Page 0 is the submitted root. */
export function renderNewsSitemap(entries, page = 0) {
  const pageCount = Math.max(1, Math.ceil(entries.length / NEWS_SITEMAP_PAGE_SIZE));
  if (!Number.isSafeInteger(page) || page < 0 || page > pageCount) return null;
  if (page === 0 && pageCount > 1) {
    const maps = Array.from({ length: pageCount }, (_, index) => `<sitemap><loc>${origin}/googlenews/${index + 1}.xml</loc></sitemap>`).join("");
    return `${declaration}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${maps}</sitemapindex>`;
  }
  const start = (Math.max(page, 1) - 1) * NEWS_SITEMAP_PAGE_SIZE;
  const urls = entries.slice(start, start + NEWS_SITEMAP_PAGE_SIZE).map((entry) =>
    `<url><loc>${escapeXml(`${origin}/haber/${encodeURIComponent(entry.slug)}`)}</loc><news:news><news:publication><news:name>Koza TV</news:name><news:language>tr</news:language></news:publication><news:publication_date>${new Date(entry.publishedAt).toISOString()}</news:publication_date><news:title>${escapeXml(entry.title)}</news:title></news:news></url>`
  ).join("");
  return `${declaration}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}</urlset>`;
}
