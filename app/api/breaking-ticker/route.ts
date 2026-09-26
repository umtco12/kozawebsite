import { listBreakingArticles } from "../../../db";
import { toBreakingItems } from "../../../db/breaking-feed-model.mjs";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ items: toBreakingItems(listBreakingArticles(5, true)) }, {
    headers: { "Cache-Control": "no-store" },
  });
}
