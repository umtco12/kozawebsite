import { getAdminArticle, getArticleStats, listArticles, saveArticle, type ArticleInput, type ArticleStatus } from "../../../db";
import { validateArticleInput } from "../../../db/article-model.mjs";
import { canAccessArticle, canEditArticle, canManageAgencyMetadata, canWriteStatus } from "../../../db/editorial-permissions.mjs";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter", "viewer"]);
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as ArticleStatus | null;
  const category = url.searchParams.get("category") || undefined;
  const limit = Number(url.searchParams.get("limit") || 50);
  const allowed = ["draft", "review", "scheduled", "published"];

  if (status && !allowed.includes(status)) {
    return Response.json({ error: "Geçersiz yayın durumu" }, { status: 400 });
  }

  return Response.json({ articles: listArticles({ status: status || undefined, category, assignedTo: auth.user!.role === "reporter" ? auth.user!.id : undefined, limit }), stats: getArticleStats() });
}

async function persist(request: Request) {
  const payload = await request.json();
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter"]);
  if (auth.response) return auth.response;
  const existing = payload.id ? getAdminArticle(Number(payload.id)) : null;
  if (payload.id && !existing) return Response.json({ error: "Haber bulunamadı." }, { status: 404 });
  if (!canWriteStatus(auth.user!.role, payload.status)) return Response.json({ error: "Yayınlama ve planlama yalnızca yayın yönetmeni veya yönetici tarafından yapılabilir." }, { status: 403 });
  if (existing && (!canAccessArticle(auth.user!.role, auth.user!.id, existing) || !canEditArticle(auth.user!.role, auth.user!.id, existing))) return Response.json({ error: auth.user!.role === "reporter" ? "Yalnızca size atanmış taslak haberleri düzenleyebilirsiniz." : "Yayındaki haber yalnızca yayın yönetmeni veya yönetici tarafından değiştirilebilir." }, { status: 403 });
  const agencyChanged = existing ? Number(payload.agencySourceId || 0) !== Number(existing.agencySourceId || 0) || String(payload.agencyExternalId || "") !== existing.agencyExternalId || String(payload.agencyCredit || "") !== existing.agencyCredit || Number(Boolean(payload.agencyEditorialLock)) !== Number(Boolean(existing.agencyEditorialLock)) : Boolean(payload.agencySourceId || payload.agencyExternalId || payload.agencyCredit);
  if (agencyChanged && !canManageAgencyMetadata(auth.user!.role)) return Response.json({ error: "Ajans bağlantısı ve kayıt bilgilerini yalnızca editör, yayın yönetmeni veya yönetici değiştirebilir." }, { status: 403 });
  const validation = validateArticleInput(payload);
  if (!validation.valid) return Response.json({ error: "Haber alanlarını kontrol edin", fields: validation.errors }, { status: 400 });

  try {
    const input = { ...payload, assignedTo: existing?.assignedTo ?? (auth.user!.role === "reporter" ? auth.user!.id : payload.assignedTo ?? null), agencySourceId: canManageAgencyMetadata(auth.user!.role) ? payload.agencySourceId : existing?.agencySourceId ?? null, agencyExternalId: canManageAgencyMetadata(auth.user!.role) ? payload.agencyExternalId : existing?.agencyExternalId ?? "", agencyCredit: canManageAgencyMetadata(auth.user!.role) ? payload.agencyCredit : existing?.agencyCredit ?? "", agencyEditorialLock: canManageAgencyMetadata(auth.user!.role) ? payload.agencyEditorialLock : existing?.agencyEditorialLock ?? 0 };
    return Response.json({ ok: true, article: saveArticle(input as ArticleInput, auth.user!) }, { status: payload.id ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("EDIT_CONFLICT")) return Response.json({ error: "Haber başka bir editör tarafından güncellendi. Son sürümü açıp değişikliklerinizi karşılaştırın.", code: "EDIT_CONFLICT" }, { status: 409 });
    if (message.includes("WORKFLOW_APPROVAL_REQUIRED")) return Response.json({ error: "Haber yayın yönetmeni onayı olmadan yayınlanamaz veya planlanamaz.", code: "WORKFLOW_APPROVAL_REQUIRED" }, { status: 409 });
    if (message.includes("AGENCY_SOURCE_NOT_FOUND")) return Response.json({ error: "Seçilen ajans bağlantısı bulunamadı." }, { status: 400 });
    if (message.includes("UNIQUE constraint failed")) return Response.json({ error: "Bu başlık veya URL adıyla bir haber zaten var" }, { status: 409 });
    return Response.json({ error: "Haber kaydedilemedi" }, { status: 503 });
  }
}

export async function POST(request: Request) { return persist(request); }
export async function PATCH(request: Request) { return persist(request); }
