import { listRecentPublishedNewsSitemapEntries } from "../../db";
import { newsSitemapHeaders, renderNewsSitemap } from "../../db/news-sitemap-model.mjs";
import { displayTitle } from "../../db/title-model.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const entries = listRecentPublishedNewsSitemapEntries().map((entry) => ({ ...entry, title: displayTitle(entry.title) }));
  return new Response(renderNewsSitemap(entries), { headers: newsSitemapHeaders });
}
