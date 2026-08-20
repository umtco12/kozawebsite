import { getArticleStats, listArticles, saveArticle, type ArticleInput, type ArticleStatus } from "../../../db";
import { validateArticleInput } from "../../../db/article-model.mjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as ArticleStatus | null;
  const category = url.searchParams.get("category") || undefined;
  const limit = Number(url.searchParams.get("limit") || 50);
  const allowed = ["draft", "review", "scheduled", "published"];

  if (status && !allowed.includes(status)) {
    return Response.json({ error: "Geçersiz yayın durumu" }, { status: 400 });
  }

  return Response.json({ articles: listArticles({ status: status || undefined, category, limit }), stats: getArticleStats() });
}

async function persist(request: Request) {
  const payload = await request.json();
  const validation = validateArticleInput(payload);
  if (!validation.valid) return Response.json({ error: "Haber alanlarını kontrol edin", fields: validation.errors }, { status: 400 });

  try {
    return Response.json({ ok: true, article: saveArticle(payload as ArticleInput) }, { status: payload.id ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE constraint failed")) return Response.json({ error: "Bu başlık veya URL adıyla bir haber zaten var" }, { status: 409 });
    return Response.json({ error: "Haber kaydedilemedi" }, { status: 503 });
  }
}

export async function POST(request: Request) { return persist(request); }
export async function PATCH(request: Request) { return persist(request); }
