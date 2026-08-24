import {
  ensureCategory, getImportStats, importLegacyArticle, listImportItems, markImportItem,
  listArticlesMissingImage, recordDiscoveredUrls, resetFailedImports, saveMediaAsset, saveRedirect,
  setArticleHeroImage, takePendingImportItems,
} from "../../../db";
import { isAllowedSource, legacyPath, mapLegacyArticle, parseSitemapEntries, parseSitemapLocations } from "../../../db/import-model.mjs";
import { storeImage } from "../../../db/media-storage";
import { authorizeAdmin } from "../write-access";

type LegacyArticle = { slug: string; title: string; spot: string; body: string; blocks: { type: string; content: string }[]; category: string; author: string; imageUrl: string; imageAlt: string; publishedAt: number | null; sourceUrl: string; seoTitle: string; seoDescription: string };
type MappedArticle = { ok: true; value: LegacyArticle } | { ok: false; reason: string };

export const dynamic = "force-dynamic";

const SITEMAP_INDEX = "https://www.kozatv.com.tr/sitemap.xml";
const FETCH_TIMEOUT_MS = 20_000;
const POLITE_DELAY_MS = 250;
/* Kapak görseli bulunamayan haberde gerçek bir haber karesi kullanılmaz; okuyucu eksikliği görmeli. */
const MISSING_IMAGE = "/news/gorsel-yok.svg";

async function fetchText(url: string) {
  if (!isAllowedSource(url)) throw new Error("Adres izin listesinde değil.");
  const response = await fetch(url, { headers: { "user-agent": "KozaTV-Icerik-Aktarimi/1.0", accept: "text/html,application/xml" }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Kaynak ${response.status} döndü.`);
  return response.text();
}

/* Kapak görseli medya kütüphanesine indirilir; eski sitenin ayakta olmasına bağlı kalınmaz. */
/* Başarısızlık sebebi çağırana döner; sessizce yutulursa sorun teşhis edilemiyor. */
async function importImage(imageUrl: string, altText: string, actor: string): Promise<{ url: string; reason: string }> {
  if (!imageUrl) return { url: "", reason: "Kaynakta kapak görseli yok" };
  if (!isAllowedSource(imageUrl)) return { url: "", reason: "Görsel adresi izin listesinde değil" };
  try {
    const response = await fetch(imageUrl, { headers: { "user-agent": "KozaTV-Icerik-Aktarimi/1.0", accept: "image/*" }, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) return { url: "", reason: `Görsel indirilemedi (HTTP ${response.status})` };
    const contentType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (!bytes.length) return { url: "", reason: "Görsel boş geldi" };
    const name = decodeURIComponent(new URL(imageUrl).pathname.split("/").pop() ?? "gorsel");
    const stored = await storeImage(new File([bytes], name, { type: contentType }));
    const media = saveMediaAsset({ ...stored, originalName: name.slice(0, 160), altText: altText.slice(0, 200), credit: "kozatv.com.tr" }, actor);
    return { url: media.publicUrl, reason: "" };
  } catch (error) {
    return { url: "", reason: `Görsel kaydedilemedi: ${error instanceof Error ? error.message : "bilinmeyen hata"}` };
  }
}

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor"]);
  if (auth.response) return auth.response;
  const status = new URL(request.url).searchParams.get("durum") as "pending" | "imported" | "skipped" | "failed" | null;
  return Response.json({ stats: getImportStats(), items: listImportItems(status ?? "all", 40) });
}

export async function POST(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  const actor = auth.user!.fullName;

  try {
    const payload = await request.json() as { action?: string; limit?: number; publish?: boolean; createRedirects?: boolean };

    /* 1. Keşif: sitemap dizininden bütün aylık sitemap'ler ve haber adresleri okunur. */
    if (payload.action === "discover") {
      const index = await fetchText(SITEMAP_INDEX);
      const monthly = parseSitemapLocations(index).filter((url) => url !== SITEMAP_INDEX);
      let discovered = 0;
      const scanned: string[] = [];
      for (const sitemapUrl of monthly) {
        try {
          const entries = parseSitemapEntries(await fetchText(sitemapUrl));
          discovered += recordDiscoveredUrls(entries);
          scanned.push(`${sitemapUrl.split("/").pop() ?? sitemapUrl}: ${entries.length}`);
        } catch {
          scanned.push(`${sitemapUrl.split("/").pop() ?? sitemapUrl}: okunamadı`);
        }
        await new Promise((resolve) => setTimeout(resolve, POLITE_DELAY_MS));
      }
      return Response.json({ ok: true, sitemaps: monthly.length, discovered, scanned, stats: getImportStats() });
    }

    /* 2. Aktarım: bekleyen adresler parça parça çekilir. Yeniden çalıştırmak güvenlidir. */
    if (payload.action === "run") {
      const limit = Math.min(Math.max(Number(payload.limit ?? 10), 1), 50);
      const items = takePendingImportItems(limit);
      if (!items.length) return Response.json({ ok: true, processed: 0, message: "Bekleyen adres yok.", stats: getImportStats() });

      const results: { url: string; status: string; message: string }[] = [];
      for (const item of items) {
        try {
          const html = await fetchText(item.sourceUrl);
          const mapped = mapLegacyArticle({ url: item.sourceUrl, html }) as MappedArticle;
          if (!mapped.ok) {
            markImportItem(item.id, "skipped", { message: mapped.reason });
            results.push({ url: item.sourceUrl, status: "skipped", message: mapped.reason });
            continue;
          }
          const value = mapped.value;
          const category = ensureCategory(value.category, actor) ?? "Gündem";
          const image = await importImage(value.imageUrl, value.imageAlt, actor);
          const article = importLegacyArticle({
            slug: value.slug, title: value.title, spot: value.spot, body: value.body, blocks: value.blocks,
            category, author: value.author, heroImage: image.url || MISSING_IMAGE, imageAlt: value.imageAlt,
            sourceUrl: value.sourceUrl, seoTitle: value.seoTitle, seoDescription: value.seoDescription,
            publishedAt: value.publishedAt, status: payload.publish ? "published" : "draft",
          }, actor);

          /* Eski adres yeni habere kalıcı olarak yönlendirilir; arama motoru değeri korunur. */
          if (payload.createRedirects !== false) {
            const fromPath = legacyPath(item.sourceUrl);
            const toPath = `/haber/${article.slug}`;
            if (fromPath && fromPath !== toPath) {
              try { saveRedirect({ fromPath, toPath, kind: "permanent", note: "Eski site aktarımı" }, actor); } catch { /* Eşleme zaten varsa atlanır. */ }
            }
          }

          markImportItem(item.id, "imported", { articleId: article.id, title: article.title, message: image.url ? "Görsel aktarıldı" : image.reason });
          results.push({ url: item.sourceUrl, status: "imported", message: article.title });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Bilinmeyen hata";
          markImportItem(item.id, "failed", { message });
          results.push({ url: item.sourceUrl, status: "failed", message });
        }
        await new Promise((resolve) => setTimeout(resolve, POLITE_DELAY_MS));
      }
      return Response.json({ ok: true, processed: results.length, results, stats: getImportStats() });
    }

    /* 3. Kapak görseli inememiş haberlerde yalnız görseli yeniden dener; haber metni yeniden çekilmez. */
    if (payload.action === "images") {
      const limit = Math.min(Math.max(Number(payload.limit ?? 25), 1), 50);
      const missing = listArticlesMissingImage(limit);
      const reasons: Record<string, number> = {};
      let recovered = 0;
      for (const article of missing) {
        try {
          const html = await fetchText(article.sourceUrl);
          const mapped = mapLegacyArticle({ url: article.sourceUrl, html }) as MappedArticle;
          const imageUrl = mapped.ok ? mapped.value.imageUrl : "";
          const image = await importImage(imageUrl, article.imageAlt, actor);
          if (image.url) { setArticleHeroImage(article.id, image.url); recovered += 1; }
          else reasons[image.reason] = (reasons[image.reason] ?? 0) + 1;
        } catch (error) {
          const reason = error instanceof Error ? error.message : "bilinmeyen hata";
          reasons[reason] = (reasons[reason] ?? 0) + 1;
        }
        await new Promise((resolve) => setTimeout(resolve, POLITE_DELAY_MS));
      }
      return Response.json({ ok: true, checked: missing.length, recovered, reasons, stats: getImportStats() });
    }

    /* 4. Başarısızları tekrar kuyruğa al. */
    if (payload.action === "retry") {
      return Response.json({ ok: true, requeued: resetFailedImports(), stats: getImportStats() });
    }

    return Response.json({ error: "Bilinmeyen işlem." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Aktarım tamamlanamadı." }, { status: 400 });
  }
}
