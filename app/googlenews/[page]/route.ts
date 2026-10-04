import { listRecentPublishedNewsSitemapEntries } from "../../../db";
import { newsSitemapHeaders, parseNewsSitemapPage, renderNewsSitemap } from "../../../db/news-sitemap-model.mjs";
import { displayTitle } from "../../../db/title-model.mjs";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ page: string }> }) {
  const page = parseNewsSitemapPage((await context.params).page);
  if (page === null) return new Response("Harita bulunamadı", { status: 404, headers: { "cache-control": "no-store" } });
  const entries = listRecentPublishedNewsSitemapEntries().map((entry) => ({ ...entry, title: displayTitle(entry.title) }));
  const xml = renderNewsSitemap(entries, page);
  if (xml === null) return new Response("Harita bulunamadı", { status: 404, headers: { "cache-control": "no-store" } });
  return new Response(xml, { headers: newsSitemapHeaders });
}
