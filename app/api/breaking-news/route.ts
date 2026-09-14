import { listLatestArticles } from "../../../db";
import { toBreakingItems } from "../../../db/breaking-feed-model.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ items: toBreakingItems(listLatestArticles(5)) }, {
    headers: { "Cache-Control": "no-store" },
  });
}
