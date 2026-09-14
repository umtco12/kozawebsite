/* Zengin metin gövdesinin tek kaynağı.

   Haber gövdesi iki biçimde saklanabilir:
   - `bodyHtml`: zengin metin editöründen gelen HTML. Doldurulmuşsa yayında bu gösterilir.
   - `content_blocks`: eski blok dizisi. `bodyHtml` boş olan bütün haberler eskisi gibi çalışır.

   `body` sütunu her iki durumda da düz metin projeksiyonudur; arama ve en az 80 karakter
   kuralı bu sütunu kullandığı için zengin metin kaydedilirken buradan üretilir. */

export const MAX_BODY_HTML = 200_000;

const blockLevelTags = "p|div|section|article|h[1-6]|ul|ol|li|blockquote|pre|figure|figcaption|table|thead|tbody|tr|td|th|hr";

const entities = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", "#x27": "'", "#160": " " };

export function decodeEntities(value) {
  return String(value ?? "").replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, name) => {
    const key = name.toLowerCase();
    if (key in entities) return entities[key];
    if (key.startsWith("#x")) { const code = Number.parseInt(key.slice(2), 16); return Number.isFinite(code) ? String.fromCodePoint(code) : match; }
    if (key.startsWith("#")) { const code = Number.parseInt(key.slice(1), 10); return Number.isFinite(code) ? String.fromCodePoint(code) : match; }
    return match;
  });
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Aramanın ve karakter sayısı kuralının çalışması için gövdenin düz metin karşılığı. */
export function htmlToPlainText(html) {
  let value = String(html ?? "");
  value = value.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ");
  value = value.replace(/<br\s*\/?>/gi, "\n");
  value = value.replace(new RegExp(`</(?:${blockLevelTags})>`, "gi"), "\n\n");
  value = value.replace(/<[^>]*>/g, "");
  value = decodeEntities(value);
  return value.replace(/\r\n?/g, "\n").replace(/[ \t\f\v]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

/* Eski blok dizisini editöre yüklenebilir HTML'e çevirir. Böylece arşivdeki bir haber
   zengin editörde açıldığında içeriği olduğu gibi gelir. */
export function blocksToHtml(blocks) {
  if (!Array.isArray(blocks)) return "";
  const parts = [];
  for (const block of blocks) {
    const content = String(block?.content ?? "").trim();
    if (!content) continue;
    const caption = String(block?.caption ?? "").trim();
    if (block.type === "heading") { parts.push(`<h2>${escapeHtml(content)}</h2>`); continue; }
    if (block.type === "quote") { parts.push(`<blockquote><p>${escapeHtml(content)}</p></blockquote>`); continue; }
    if (block.type === "list") {
      const items = content.split("\n").map((item) => item.trim()).filter(Boolean).map((item) => `<li><p>${escapeHtml(item)}</p></li>`).join("");
      if (items) parts.push(`<ul>${items}</ul>`);
      continue;
    }
    if (block.type === "image") { parts.push(`<img src="${escapeHtml(content)}" alt="${escapeHtml(caption || "Haber görseli")}">`); continue; }
    if (block.type === "video" || block.type === "embed") { parts.push(`<p><a href="${escapeHtml(content)}">${escapeHtml(caption || content)}</a></p>`); continue; }
    parts.push(`<p>${escapeHtml(content).replace(/\n/g, "<br>")}</p>`);
  }
  return parts.join("");
}

/* Düz metni editöre yüklenebilir HTML'e çevirir; boş satırlar paragraf sınırıdır. */
export function plainTextToHtml(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n").split(/\n\s*\n+/).map((chunk) => chunk.trim()).filter(Boolean)
    .map((chunk) => `<p>${escapeHtml(chunk).replace(/\n/g, "<br>")}</p>`).join("");
}

/* Kaydedilen gövdeyi ölçülebilir sınırlar içinde tutar. İçeriği yeniden yazmaz;
   yalnız boş gövdeyi sadeleştirir ve aşırı uzun yükü keser. */
export function normalizeArticleHtml(html) {
  const value = String(html ?? "").trim();
  if (!value) return "";
  if (!htmlToPlainText(value) && !/<(img|iframe|video|hr|table)\b/i.test(value)) return "";
  return value.length > MAX_BODY_HTML ? value.slice(0, MAX_BODY_HTML) : value;
}
