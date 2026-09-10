import { getHomepageLayout, HomepageLayoutConflictError, saveHomepageLayout } from "../../../db";
import { validateHomepageLayout } from "../../../db/homepage-order.mjs";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin"]);
  if (auth.response) return auth.response;
  return Response.json(getHomepageLayout());
}

export async function PATCH(request: Request) {
  const auth = authorizeAdmin(request, ["admin"]);
  if (auth.response) return auth.response;

  try {
    const payload = await request.json() as { revision?: unknown; layout?: unknown };
    const validation = validateHomepageLayout(payload.layout);
    if (!validation.valid) {
      return Response.json({ error: "Ana sayfa alanlarını kontrol edin.", fields: validation.errors }, { status: 400 });
    }
    const saved = saveHomepageLayout(validation.value, String(payload.revision || ""), auth.user!);
    return Response.json({ ok: true, ...saved });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "İstek gövdesi geçerli JSON olmalıdır." }, { status: 400 });
    if (error instanceof HomepageLayoutConflictError) return Response.json({ error: "Ana sayfa başka bir yönetici tarafından değiştirildi. Güncel düzeni açıp tekrar deneyin.", code: "EDIT_CONFLICT" }, { status: 409 });
    if (error instanceof Error && error.message === "HOMEPAGE_ARTICLE_NOT_FOUND") return Response.json({ error: "Seçilen haberlerden biri artık yayında değil. Listeyi yenileyin." }, { status: 400 });
    console.error("Ana sayfa düzeni kaydedilemedi", error);
    return Response.json({ error: "Ana sayfa düzeni şu anda kaydedilemedi." }, { status: 500 });
  }
}
