import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { timingSafeEqual } from "node:crypto";
import { ensureCategory, getNewsSource, listDueNewsSources, markNewsSourceCheck, saveMediaAsset, upsertAgencyArticle, type ContentBlock, type NewsSource } from "../../../db";
import { applyCategoryMap, buildAgencyHeaders, normalizeAgencyPayload } from "../../../db/agency-model.mjs";
import { MAX_IMAGE_BYTES, storeImage } from "../../../db/media-storage";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";
const MAX_FEED_BYTES = 20 * 1024 * 1024;

function cronAuthorized(request: Request) {
  const expected = process.env.KOZA_AGENCY_CRON_TOKEN || "";
  const actual = request.headers.get("x-koza-agency-token") || "";
  if (!expected || expected.length !== actual.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
}

function privateAddress(address: string) {
  if (address === "::1" || address.startsWith("fe80:") || address.startsWith("fc") || address.startsWith("fd")) return true;
  const parts = address.split(".").map(Number);
  return isIP(address) === 4 && (parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168));
}

async function assertPublicHttps(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("AGENCY_HTTPS_REQUIRED");
  const addresses = await lookup(url.hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => privateAddress(entry.address))) throw new Error("AGENCY_PRIVATE_ADDRESS");
  return url;
}

async function fetchSafe(value: string, init: RequestInit = {}, redirects = 0): Promise<Response> {
  const url = await assertPublicHttps(value);
  const response = await fetch(url, { ...init, redirect: "manual", signal: AbortSignal.timeout(20_000) });
  if ([301, 302, 303, 307, 308].includes(response.status)) {
    if (redirects >= 3) throw new Error("AGENCY_REDIRECT_LIMIT");
    const location = response.headers.get("location"); if (!location) throw new Error("AGENCY_REDIRECT_INVALID");
    const target = new URL(location, url);
    const headers = new Headers(init.headers);
    if (target.origin !== url.origin && headers.has("authorization")) throw new Error("AGENCY_AUTH_REDIRECT_BLOCKED");
    return fetchSafe(target.toString(), init, redirects + 1);
  }
  return response;
}

async function readLimited(response: Response, maximum: number) {
  const advertised = Number(response.headers.get("content-length") || 0);
  if (advertised > maximum) throw new Error("AGENCY_RESPONSE_TOO_LARGE");
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader(); const chunks: Buffer[] = []; let total = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; total += value.byteLength; if (total > maximum) { await reader.cancel(); throw new Error("AGENCY_RESPONSE_TOO_LARGE"); } chunks.push(Buffer.from(value)); }
  return Buffer.concat(chunks);
}

async function loadFeed(source: NewsSource) {
  const response = await fetchSafe(source.url, { headers: buildAgencyHeaders(source) });
  if (!response.ok) throw new Error(`AGENCY_HTTP_${response.status}`);
  const payload = (await readLimited(response, MAX_FEED_BYTES)).toString("utf8");
  return normalizeAgencyPayload(payload, source);
}

async function storeAgencyMedia(source: NewsSource, item: ReturnType<typeof normalizeAgencyPayload>[number]) {
  const blocks: ContentBlock[] = item.body.split(/\n{2,}/).filter(Boolean).map((content: string, index: number) => ({ id: `agency-p-${index}`, type: "paragraph", content }));
  let credit = item.rights || source.name;
  for (const [index, media] of item.media.slice(0, 8).entries()) {
    if (media.kind === "video") { blocks.push({ id: `agency-v-${index}`, type: "video", content: media.url, caption: media.alt }); continue; }
    try {
      const response = await fetchSafe(media.url);
      if (!response.ok) continue;
      const bytes = await readLimited(response, MAX_IMAGE_BYTES);
      const file = new File([bytes], new URL(media.url).pathname.split("/").pop() || `ajans-${index}.jpg`, { type: response.headers.get("content-type")?.split(";")[0] || "" });
      const stored = await storeImage(file);
      saveMediaAsset({ ...stored, originalName: file.name, altText: media.alt || item.title, credit: media.credit || source.name }, `${source.name} otomasyonu`);
      blocks.push({ id: `agency-i-${index}`, type: "image", content: stored.publicUrl, caption: media.alt || item.title });
      if (media.credit) credit = media.credit;
    } catch { /* Tek bir medya hatası metin akışını durdurmaz; ham kayıt tekrar deneme için korunur. */ }
  }
  return { blocks, credit };
}

async function runSource(source: NewsSource, testOnly: boolean) {
  try {
    const items = await loadFeed(source);
    if (testOnly) { markNewsSourceCheck(source.id, { ok: true }); return { sourceId: source.id, name: source.name, detected: items.length, created: 0, updated: 0, withdrawn: 0, pending: 0, unchanged: 0 }; }
    const counts = { created: 0, updated: 0, withdrawn: 0, pending: 0, unchanged: 0 };
    for (const item of items.slice(0, 50)) {
      const category = applyCategoryMap(item.category, source.categoryMap, source.defaultCategory);
      ensureCategory(category, `${source.name} otomasyonu`);
      const media = await storeAgencyMedia(source, item);
      const result = upsertAgencyArticle(source, { ...item, status: item.status as "published" | "updated" | "withdrawn", category, blocks: media.blocks, credit: media.credit, sourceUrl: item.sourceUrl || source.url });
      counts[result.action] += 1;
    }
    markNewsSourceCheck(source.id, { ok: true });
    return { sourceId: source.id, name: source.name, detected: items.length, ...counts };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AGENCY_UNKNOWN_ERROR";
    markNewsSourceCheck(source.id, { ok: false, error: message });
    return { sourceId: source.id, name: source.name, error: message };
  }
}

export async function POST(request: Request) {
  const cron = cronAuthorized(request);
  const auth = cron ? { response: null } : authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  const payload = await request.json().catch(() => ({})) as { action?: string; sourceId?: number };
  const action = payload.action || (cron ? "run-due" : "pull");
  if (!["test", "pull", "run-due"].includes(action)) return Response.json({ error: "Geçersiz ajans işlemi." }, { status: 400 });
  const sources = action === "run-due" ? listDueNewsSources() : [getNewsSource(Number(payload.sourceId))].filter(Boolean) as NewsSource[];
  if (!sources.length && action !== "run-due") return Response.json({ error: "Ajans kaynağı bulunamadı." }, { status: 404 });
  const results = [];
  for (const source of sources) results.push(await runSource(source, action === "test"));
  const failed = results.filter((item) => "error" in item).length;
  return Response.json({ ok: failed === 0, checked: results.length, failed, results }, { status: failed && failed === results.length ? 502 : 200 });
}
