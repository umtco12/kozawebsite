/* Eski Koza TV sitesinden içerik aktarımının ayrıştırma kuralları.
   Ağ erişimi olmadan test edilebilmesi için tamamı saf fonksiyondur. */

import { slugify } from "./article-model.mjs";

/* Aktarım yalnızca kurumun kendi eski alan adından yapılabilir. Sunucu tarafında serbest adres
   çekmeyi (SSRF) engellemek için izin listesi zorunludur. */
export const allowedImportHosts = ["kozatv.com.tr", "www.kozatv.com.tr"];

export function isAllowedSource(url) {
  try {
    const parsed = new URL(url);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && allowedImportHosts.includes(parsed.host.toLowerCase());
  } catch {
    return false;
  }
}

export function parseSitemapLocations(xml) {
  return [...String(xml ?? "").matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
    .map((match) => match[1].trim())
    .filter((url) => isAllowedSource(url));
}

export function parseSitemapEntries(xml) {
  const entries = [];
  for (const [, block] of String(xml ?? "").matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const url = /<loc>\s*([^<\s]+)\s*<\/loc>/.exec(block)?.[1]?.trim();
    if (!url || !isAllowedSource(url)) continue;
    const lastmod = /<lastmod>\s*([^<\s]+)\s*<\/lastmod>/.exec(block)?.[1]?.trim() ?? "";
    const parsed = lastmod ? Date.parse(lastmod) : NaN;
    entries.push({ url, lastmod: Number.isFinite(parsed) ? parsed : null });
  }
  return entries;
}

function decodeEntities(value) {
  return String(value ?? "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function stripTags(value) {
  return decodeEntities(String(value ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")).replace(/[ \t]+/g, " ").trim();
}

export function extractNewsArticleJsonLd(html) {
  for (const [, raw] of String(html ?? "").matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(raw.trim());
      const candidates = Array.isArray(data) ? data : data?.["@graph"] ? data["@graph"] : [data];
      for (const item of candidates) {
        if (item && (item["@type"] === "NewsArticle" || item["@type"] === "Article")) return item;
      }
    } catch { /* Bozuk JSON-LD bloğu atlanır, diğer bloklara bakılır. */ }
  }
  return null;
}

function metaContent(html, pattern) {
  const match = new RegExp(`<meta[^>]*(?:property|name)="${pattern}"[^>]*content="([^"]*)"`, "i").exec(html)
    ?? new RegExp(`<meta[^>]*content="([^"]*)"[^>]*(?:property|name)="${pattern}"`, "i").exec(html);
  return match ? decodeEntities(match[1]).trim() : "";
}

/* Haber gövdesi JSON-LD'de yaklaşık 500 karakterde kesildiği için tam metin sayfadaki
   içerik konteynerinden okunur. Paragraflar ve ara başlıklar korunur. */
export function extractBodyBlocks(html) {
  const source = String(html ?? "");
  const start = source.search(/<div[^>]*class="[^"]*\bdetay\b[^"]*"/i);
  if (start === -1) return [];
  const rest = source.slice(start);
  const endMarkers = [/class="[^"]*haber-yorum[^"]*"/i, /class="[^"]*haber-sag-reklam[^"]*"/i, /<footer/i];
  let end = rest.length;
  for (const marker of endMarkers) {
    const position = rest.search(marker);
    if (position !== -1 && position < end) end = position;
  }
  const segment = rest.slice(0, end);

  const blocks = [];
  for (const [, inner] of segment.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    const text = stripTags(inner);
    if (text.length < 2) continue;
    /* Arayüz etiketleri gövdeye girmez. `\b` sınırı Türkçe harflerde çalışmadığı için
       satırın tamamı karşılaştırılır. */
    if (/^(paylaş|paylaşın|yorum yap|yorumlar|etiketler|kaynak|reklam)\s*:?\s*$/i.test(text)) continue;
    /* Kısa, tamamı büyük harf satırlar özgün haberde ara başlıktır. */
    const letters = text.replace(/[^\p{L}]/gu, "");
    const isHeading = text.length <= 90 && letters.length > 2 && letters === letters.toLocaleUpperCase("tr-TR") && !/\.$/.test(text);
    blocks.push({ type: isHeading ? "heading" : "paragraph", content: text });
  }
  return blocks;
}

/* Eski adresten sabit bir slug üretir. Başlık değişse bile aynı haber aynı slug'a düşer. */
export function slugFromLegacyUrl(url, fallbackTitle = "") {
  try {
    const path = new URL(url).pathname;
    const file = path.split("/").pop() ?? "";
    const bare = file.replace(/\.html?$/i, "").replace(/^haber-/i, "");
    const slug = slugify(bare);
    if (slug) return slug.slice(0, 120);
  } catch { /* Adres okunamazsa başlıktan üretilir. */ }
  return slugify(fallbackTitle).slice(0, 120);
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return decodeEntities(value).trim();
  }
  return "";
}

/* Eski site, kapak görseli olmayan haberlerde dosya adı içermeyen bir klasör yolu yayımlıyor
   (".../images/haber/"). Böyle adaylar görsel sayılmaz; aksi hâlde 403 sayfası indirilirdi. */
function looksLikeImage(candidate) {
  if (!isAllowedSource(candidate)) return false;
  try {
    const file = new URL(candidate).pathname.split("/").pop() ?? "";
    return /\.(jpe?g|png|webp|gif)$/i.test(file);
  } catch {
    return false;
  }
}

function pickImage(data, html) {
  const fromData = typeof data?.image === "string" ? data.image : data?.image?.url;
  for (const candidate of [fromData, data?.thumbnailUrl, metaContent(html, "og:image"), metaContent(html, "twitter:image")]) {
    const value = firstString(candidate);
    if (looksLikeImage(value)) return value;
  }
  return "";
}

/* Bir haber sayfasını uygulamanın haber alanlarına çevirir. */
export function mapLegacyArticle({ url, html }) {
  const data = extractNewsArticleJsonLd(html) ?? {};
  const title = firstString(data.headline, data.name, metaContent(html, "og:title"));
  if (!title) return { ok: false, reason: "Başlık bulunamadı" };

  const blocks = extractBodyBlocks(html);
  const bodyText = blocks.map((block) => block.content).join("\n\n");
  const jsonBody = firstString(data.articleBody);
  /* Sayfadan çıkarılan metin JSON-LD özetinden kısaysa özet kullanılır. */
  const body = bodyText.length >= jsonBody.length ? bodyText : jsonBody;
  if (body.length < 40) return { ok: false, reason: "Haber metni bulunamadı" };

  /* Eski sitede açıklama çoğu haberde başlığın kopyası; böyle durumlarda gövdenin ilk
     paragrafı spot olarak daha bilgilendirici. */
  const described = firstString(data.description, metaContent(html, "og:description"));
  const sameAsTitle = described.replace(/[^\p{L}\p{N}]+/gu, "").toLocaleLowerCase("tr-TR") === title.replace(/[^\p{L}\p{N}]+/gu, "").toLocaleLowerCase("tr-TR");
  const firstParagraph = blocks.find((block) => block.type === "paragraph")?.content ?? "";
  const spotSource = (!described || sameAsTitle) ? (firstParagraph || described || body) : described;
  const spot = spotSource.length > 240 ? `${spotSource.slice(0, 237).trimEnd()}…` : spotSource;
  const publishedAt = Date.parse(firstString(data.datePublished, data.dateCreated, metaContent(html, "article:published_time")));
  const category = firstString(data.articleSection, metaContent(html, "article:section")) || "Gündem";
  const author = firstString(data.author?.name, metaContent(html, "articleAuthor")) || "Koza TV Haber Merkezi";
  const imageUrl = pickImage(data, html);

  return {
    ok: true,
    value: {
      slug: slugFromLegacyUrl(url, title),
      title: title.length > 110 ? `${title.slice(0, 107).trimEnd()}…` : title,
      spot: spot.length < 24 ? `${title} — Koza TV Haber Merkezi` : spot,
      body,
      blocks: blocks.length ? blocks : [{ type: "paragraph", content: body }],
      category,
      author,
      imageUrl,
      imageAlt: firstString(data.image?.caption, metaContent(html, "og:image:alt"), title),
      publishedAt: Number.isFinite(publishedAt) ? publishedAt : null,
      sourceUrl: url,
      seoTitle: title,
      seoDescription: spot,
    },
  };
}

/* Eski adresin site kökünden yolunu verir; yönlendirme tablosuna bu değer yazılır. */
export function legacyPath(url) {
  try { return new URL(url).pathname.toLowerCase(); } catch { return ""; }
}
