import { createHash } from "node:crypto";

export const DEFAULT_AGENCY_DISCLAIMER = "Bu haber {agency} tarafından servis edilmiş, Koza TV ajans akışı tarafından otomatik olarak alınmıştır. İçeriğin kaynağı ve varsa güncelleme ya da geri çekme kayıtları ajans kimliğiyle birlikte saklanır.";

const allowedProviders = new Set(["aa", "iha", "dha", "other"]);
const allowedFormats = new Set(["rss", "json", "newsml"]);
const allowedAuth = new Set(["none", "bearer", "basic"]);
const allowedModes = new Set(["review", "auto"]);
const privateHosts = /^(localhost|0\.0\.0\.0|127(?:\.\d+){3}|10(?:\.\d+){3}|192\.168(?:\.\d+){2}|169\.254(?:\.\d+){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d+){2}|\[?::1\]?)$/i;

function clean(value, max = 10_000) { return String(value ?? "").split("\u0000").join("").trim().slice(0, max); }
function decodeXml(value) {
  return clean(value, 200_000)
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
}
function textFromHtml(value) {
  return decodeXml(value)
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|h[1-6]|li)>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function first(value, keys) { for (const key of keys) if (value?.[key] != null && value[key] !== "") return value[key]; return ""; }
function asTimestamp(value) { if (typeof value === "number" && Number.isFinite(value)) return value < 10_000_000_000 ? value * 1000 : value; const parsed = Date.parse(String(value ?? "")); return Number.isFinite(parsed) ? parsed : null; }
function absoluteUrl(value) { try { const url = new URL(String(value)); return url.protocol === "https:" ? url.toString() : ""; } catch { return ""; } }
function array(value) { return Array.isArray(value) ? value : value ? [value] : []; }
function mediaEntries(value, kind) {
  return array(value).map((entry) => typeof entry === "string" ? { url: absoluteUrl(entry), alt: "", credit: "" } : {
    url: absoluteUrl(first(entry, ["url", "src", "href", "contentUrl"])),
    alt: clean(first(entry, ["alt", "title", "caption", "description"]), 300),
    credit: clean(first(entry, ["credit", "copyright", "byline", "creator"]), 200),
  }).filter((entry) => entry.url).map((entry) => ({ ...entry, kind }));
}
function normalizeStatus(value) { const status = clean(value, 30).toLowerCase(); return /withdraw|delete|cancel|iptal|geri.?çek/.test(status) ? "withdrawn" : /update|correct|düzelt/.test(status) ? "updated" : "published"; }
function normalizeJsonItem(item, source, index) {
  const title = clean(first(item, ["title", "headline", "name"]), 300);
  const body = textFromHtml(first(item, ["body", "articleBody", "content", "content_text", "text", "description"]));
  const spotCandidate = textFromHtml(first(item, ["spot", "summary", "abstract", "description", "lead"]));
  const sourceUrl = absoluteUrl(first(item, ["url", "link", "canonicalUrl", "webUrl"]));
  const externalId = clean(first(item, ["id", "guid", "uuid", "newsId", "externalId"]) || sourceUrl || `${title}-${index}`, 300);
  const images = [
    ...mediaEntries(first(item, ["images", "image", "photos", "photo"]), "image"),
    ...mediaEntries(first(item, ["thumbnail", "heroImage"]), "image"),
  ];
  const videos = mediaEntries(first(item, ["videos", "video"]), "video");
  return {
    externalId, title, spot: spotCandidate || body.slice(0, 240), body,
    category: clean(first(item, ["category", "section", "articleSection"]) || source.defaultCategory, 80),
    author: clean(first(item, ["author", "byline", "creator"]) || source.name, 120),
    sourceUrl, publishedAt: asTimestamp(first(item, ["publishedAt", "datePublished", "pubDate", "published", "createdAt"])),
    updatedAt: asTimestamp(first(item, ["updatedAt", "dateModified", "modified", "updated"])),
    status: normalizeStatus(first(item, ["status", "state", "action"])),
    urgency: clean(first(item, ["urgency", "priority"]), 40), location: clean(first(item, ["location", "dateline", "place"]), 160),
    rights: clean(first(item, ["rights", "copyright", "license"]), 500), tags: array(first(item, ["tags", "keywords"])).map((tag) => clean(typeof tag === "object" ? first(tag, ["name", "label"]) : tag, 80)).filter(Boolean),
    media: [...images, ...videos], raw: item,
  };
}

function xmlValue(block, names) {
  for (const name of names) {
    const escaped = name.replace(":", "\\:");
    const paired = block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`, "i"));
    if (paired) return paired[1];
    const attribute = block.match(new RegExp(`<${escaped}[^>]*(?:url|href)=["']([^"']+)["'][^>]*\\/?>(?:<\\/${escaped}>)?`, "i"));
    if (attribute) return attribute[1];
  }
  return "";
}
function xmlMedia(block) {
  const media = [];
  const pattern = /<(?:media:content|media:thumbnail|enclosure)\b([^>]*)>/gi;
  for (const match of block.matchAll(pattern)) {
    const url = absoluteUrl(match[1].match(/(?:url|href)=["']([^"']+)["']/i)?.[1]);
    const type = clean(match[1].match(/type=["']([^"']+)["']/i)?.[1]).toLowerCase();
    if (url) media.push({ url, alt: textFromHtml(xmlValue(block, ["media:title", "media:description"])), credit: textFromHtml(xmlValue(block, ["media:credit"])), kind: type.startsWith("video/") ? "video" : "image" });
  }
  return media;
}
function parseRss(xml, source) {
  const blocks = [...String(xml).matchAll(/<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((match) => match[2]);
  return blocks.map((block, index) => {
    const title = textFromHtml(xmlValue(block, ["title"]));
    const link = absoluteUrl(xmlValue(block, ["link"]));
    const body = textFromHtml(xmlValue(block, ["content:encoded", "content", "description", "summary"]));
    const id = textFromHtml(xmlValue(block, ["guid", "id"])) || link || `${title}-${index}`;
    return {
      externalId: clean(id, 300), title: clean(title, 300), spot: textFromHtml(xmlValue(block, ["summary", "description"])).slice(0, 240) || body.slice(0, 240), body,
      category: clean(textFromHtml(xmlValue(block, ["category"])) || source.defaultCategory, 80), author: clean(textFromHtml(xmlValue(block, ["dc:creator", "author"])) || source.name, 120), sourceUrl: link,
      publishedAt: asTimestamp(textFromHtml(xmlValue(block, ["pubDate", "published", "dc:date"]))), updatedAt: asTimestamp(textFromHtml(xmlValue(block, ["updated"]))), status: normalizeStatus(textFromHtml(xmlValue(block, ["status"]))), urgency: "", location: "", rights: textFromHtml(xmlValue(block, ["copyright", "rights"])), tags: [], media: xmlMedia(block), raw: block,
    };
  });
}

function parseNewsml(xml, source) {
  const matches = [...String(xml).matchAll(/<(?:[\w-]+:)?newsItem\b([^>]*)>([\s\S]*?)<\/(?:[\w-]+:)?newsItem>/gi)];
  return matches.map((match, index) => {
    const attributes = match[1]; const block = match[2];
    const title = textFromHtml(xmlValue(block, ["headline", "title", "slugline"]));
    const bodyMarkup = xmlValue(block, ["body", "inlineXML", "content"]);
    const body = textFromHtml(bodyMarkup);
    const sourceUrl = absoluteUrl(block.match(/<(?:[\w-]+:)?link\b[^>]*href=["']([^"']+)["']/i)?.[1]);
    const externalId = clean(attributes.match(/\bguid=["']([^"']+)["']/i)?.[1] || textFromHtml(xmlValue(block, ["altId", "itemClass"])) || sourceUrl || `${title}-${index}`, 300);
    const subjectBlock = block.match(/<(?:[\w-]+:)?subject\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?subject>/i)?.[1] || "";
    const pubStatus = block.match(/<(?:[\w-]+:)?pubStatus\b[^>]*qcode=["']([^"']+)["']/i)?.[1] || "";
    const media = [];
    for (const remote of block.matchAll(/<(?:[\w-]+:)?remoteContent\b([^>]*)>/gi)) {
      const url = absoluteUrl(remote[1].match(/(?:href|resid)=["']([^"']+)["']/i)?.[1]);
      const type = clean(remote[1].match(/contenttype=["']([^"']+)["']/i)?.[1]).toLowerCase();
      if (url) media.push({ url, alt: title, credit: textFromHtml(xmlValue(block, ["creditline"])), kind: type.includes("video") ? "video" : "image" });
    }
    return {
      externalId, title: clean(title, 300), spot: textFromHtml(xmlValue(block, ["description", "summary"])).slice(0, 240) || body.slice(0, 240), body,
      category: clean(textFromHtml(xmlValue(subjectBlock, ["name"])) || source.defaultCategory, 80), author: clean(textFromHtml(xmlValue(block, ["by", "creator"])) || source.name, 120), sourceUrl,
      publishedAt: asTimestamp(textFromHtml(xmlValue(block, ["contentCreated", "firstCreated"]))), updatedAt: asTimestamp(textFromHtml(xmlValue(block, ["versionCreated", "versioned"]))), status: normalizeStatus(pubStatus), urgency: textFromHtml(xmlValue(block, ["urgency"])), location: textFromHtml(xmlValue(block, ["dateline", "located"])), rights: textFromHtml(xmlValue(block, ["copyrightHolder", "copyrightNotice", "usageTerms"])), tags: [], media, raw: block,
    };
  });
}

export function validateAgencySource(input) {
  const errors = {};
  const name = clean(input?.name, 120); if (name.length < 2) errors.name = "Kaynak adı en az 2 karakter olmalı.";
  let url; try { url = new URL(String(input?.url ?? "")); if (url.protocol !== "https:" || privateHosts.test(url.hostname)) throw new Error(); } catch { errors.url = "Yalnızca internete açık güvenli bir HTTPS ajans adresi girin."; }
  const provider = allowedProviders.has(input?.provider) ? input.provider : "other";
  const feedFormat = allowedFormats.has(input?.feedFormat) ? input.feedFormat : "rss";
  const authType = allowedAuth.has(input?.authType) ? input.authType : "none";
  const secretEnv = clean(input?.secretEnv, 80);
  if (authType !== "none" && !/^KOZA_AGENCY_[A-Z0-9_]+$/.test(secretEnv)) errors.secretEnv = "Anahtar adı KOZA_AGENCY_ ile başlamalı; gerçek parola buraya yazılmaz.";
  const publishMode = allowedModes.has(input?.publishMode) ? input.publishMode : "review";
  const pollIntervalMinutes = Math.min(Math.max(Number(input?.pollIntervalMinutes) || 15, 5), 1440);
  const disclaimer = input?.disclaimer === undefined ? DEFAULT_AGENCY_DISCLAIMER : clean(input.disclaimer, 1000);
  const categoryMap = clean(input?.categoryMap || "{}", 4000);
  try { const parsed = JSON.parse(categoryMap); if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error(); } catch { errors.categoryMap = "Kategori eşlemesi geçerli bir JSON nesnesi olmalı."; }
  return { valid: Object.keys(errors).length === 0, errors, value: { name, url: url?.toString() || "", type: "agency", provider, feedFormat, authType, secretEnv, publishMode, pollIntervalMinutes, defaultCategory: clean(input?.defaultCategory || "Gündem", 80), categoryMap, disclaimer, active: input?.active === false || Number(input?.active) === 0 ? 0 : 1 } };
}

export function buildAgencyHeaders(source, env = process.env) {
  const headers = { accept: source.feedFormat === "json" ? "application/json" : "application/rss+xml, application/xml, text/xml" };
  if (source.authType === "none") return headers;
  const secret = env[source.secretEnv];
  if (!secret) throw new Error("AGENCY_SECRET_MISSING");
  headers.authorization = source.authType === "basic" ? `Basic ${Buffer.from(secret).toString("base64")}` : `Bearer ${secret}`;
  return headers;
}

export function normalizeAgencyPayload(payload, source) {
  let items;
  if (source.feedFormat === "json") {
    const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
    const values = Array.isArray(parsed) ? parsed : first(parsed, ["items", "articles", "data", "results"]);
    if (!Array.isArray(values)) throw new Error("AGENCY_ITEMS_MISSING");
    items = values.map((item, index) => normalizeJsonItem(item, source, index));
  } else if (source.feedFormat === "newsml") items = parseNewsml(String(payload), source);
  else items = parseRss(String(payload), source);
  return items.filter((item) => item.externalId && (item.status === "withdrawn" || (item.title.length >= 8 && item.body.length >= 40))).map((item) => ({ ...item, payloadHash: createHash("sha256").update(JSON.stringify(item.raw)).digest("hex") }));
}

export function applyCategoryMap(category, rawMap, fallback = "Gündem") {
  try { const map = JSON.parse(rawMap || "{}"); const mapped = map[category] || map[String(category).toLocaleLowerCase("tr-TR")]; return clean(mapped || category || fallback, 80); } catch { return clean(category || fallback, 80); }
}

export function agencyUpdateDecision(record, incomingHash, editorialLock) {
  if (String(record?.payloadHash || "") === incomingHash) return "unchanged";
  if (editorialLock && String(record?.pendingHash || "") === incomingHash) return "pending";
  if (editorialLock) return "queue";
  return "apply";
}

export function renderAgencyDisclaimer(template, agency) { return clean(template, 1000).replaceAll("{agency}", clean(agency, 120)); }
