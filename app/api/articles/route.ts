import { getAdminArticle, getArticleStats, listArticles, countArchiveArticles, saveArticle, type ArticleInput, type ArticleStatus } from "../../../db";
import { validateArticleInput } from "../../../db/article-model.mjs";
import { canAccessArticle, canEditArticle, canManageAgencyMetadata, canWriteStatus } from "../../../db/editorial-permissions.mjs";
import { isUniqueConstraintError } from "../../../db/error-model.mjs";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter", "viewer"]);
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const status = url.searchParams.get("status") as ArticleStatus | null;
  const category = url.searchParams.get("category") || undefined;
  const search = url.searchParams.get("q") || undefined;
  const limit = Number(url.searchParams.get("limit") || 50);
  const page = Number(url.searchParams.get("page") || 1);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || page > 1000000) return Response.json({ error: "Geçersiz sayfa veya kayıt sınırı." }, { status: 400 });
  const allowed = ["draft", "review", "scheduled", "published"];

  if (status && !allowed.includes(status)) {
    return Response.json({ error: "Geçersiz yayın durumu" }, { status: 400 });
  }

  const options = { status: status || undefined, category, search, assignedTo: auth.user!.role === "reporter" ? auth.user!.id : undefined, limit, offset: (page - 1) * limit };
  const total = countArchiveArticles(options);
  return Response.json({ articles: listArticles(options), stats: getArticleStats(), pagination: { page, pageSize: limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
}

async function persist(request: Request) {
  const payload = await request.json();
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter"]);
  if (auth.response) return auth.response;
  const existing = payload.id ? getAdminArticle(Number(payload.id)) : null;
  if (payload.id && !existing) return Response.json({ error: "Haber bulunamadı." }, { status: 404 });
  if (!canWriteStatus(auth.user!.role, payload.status)) return Response.json({ error: "Yayınlama ve planlama yalnızca yönetici tarafından yapılabilir." }, { status: 403 });
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
    if (message.includes("WORKFLOW_APPROVAL_REQUIRED")) return Response.json({ error: "Haber yalnızca yönetici tarafından yayınlanabilir veya planlanabilir.", code: "WORKFLOW_APPROVAL_REQUIRED" }, { status: 409 });
    if (message.includes("AGENCY_SOURCE_NOT_FOUND")) return Response.json({ error: "Seçilen ajans bağlantısı bulunamadı." }, { status: 400 });
    if (isUniqueConstraintError(error)) return Response.json({ error: "Bu başlık veya URL adıyla bir haber zaten var" }, { status: 409 });
    console.error("Haber kayıt hatası", error);
    return Response.json({ error: "Haber kaydedilemedi" }, { status: 503 });
  }
}

export async function POST(request: Request) { return persist(request); }
export async function PATCH(request: Request) { return persist(request); }
