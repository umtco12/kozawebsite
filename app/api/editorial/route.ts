import { addArticleComment, applyWorkflowAction, getEditorialReport, listAdminUsers, listArticleComments, listArticleRevisions, listWorkflowEvents, restoreArticleRevision } from "../../../db";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

const allRoles = ["admin", "publisher", "editor", "reporter", "viewer"] as const;
const actionRoles = {
  assign: ["admin", "publisher", "editor"],
  submit_review: ["admin", "publisher", "editor", "reporter"],
  request_changes: ["admin", "publisher", "editor"],
  approve: ["admin", "publisher"],
  reject: ["admin", "publisher", "editor"],
  publish: ["admin", "publisher"],
  withdraw: ["admin", "publisher"],
  correction: ["admin", "publisher", "editor"],
  reopen: ["admin", "publisher", "editor"],
} as const;

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, allRoles); if (auth.response) return auth.response;
  const articleId = Number(new URL(request.url).searchParams.get("articleId"));
  if (!Number.isInteger(articleId) || articleId < 1) return Response.json({ error: "Haber seçilmedi." }, { status: 400 });
  return Response.json({ revisions: listArticleRevisions(articleId), comments: listArticleComments(articleId), events: listWorkflowEvents(articleId), report: getEditorialReport(), users: listAdminUsers().filter((user) => user.active).map(({ id, fullName, role }) => ({ id, fullName, role })) });
}

export async function POST(request: Request) {
  const payload = await request.json() as { type?: "comment" | "restore" | "workflow"; articleId?: number; revisionId?: number; action?: keyof typeof actionRoles; note?: string; assigneeId?: number | null };
  if (!Number.isInteger(payload.articleId) || Number(payload.articleId) < 1) return Response.json({ error: "Geçerli haber seçilmedi." }, { status: 400 });
  if (payload.type === "comment") { const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter"]); if (auth.response) return auth.response; try { const id = addArticleComment(Number(payload.articleId), String(payload.note ?? ""), auth.user!); return Response.json({ ok: true, id }, { status: 201 }); } catch { return Response.json({ error: "Yorum en az iki karakter olmalı." }, { status: 400 }); } }
  if (payload.type === "restore") { const auth = authorizeAdmin(request, ["admin", "publisher", "editor"]); if (auth.response) return auth.response; try { return Response.json({ ok: true, article: restoreArticleRevision(Number(payload.articleId), Number(payload.revisionId), auth.user!) }); } catch { return Response.json({ error: "Revizyon geri yüklenemedi." }, { status: 409 }); } }
  if (payload.type === "workflow" && payload.action && payload.action in actionRoles) { const auth = authorizeAdmin(request, actionRoles[payload.action]); if (auth.response) return auth.response; const requiredNote = ["request_changes", "reject", "withdraw", "correction"].includes(payload.action); if (requiredNote && String(payload.note ?? "").trim().length < 4) return Response.json({ error: "Bu işlem için açıklama zorunludur." }, { status: 400 }); try { return Response.json({ ok: true, article: applyWorkflowAction(Number(payload.articleId), payload.action, String(payload.note ?? ""), auth.user!, payload.assigneeId) }); } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "İşlem tamamlanamadı." }, { status: 400 }); } }
  return Response.json({ error: "Geçersiz editoryal işlem." }, { status: 400 });
}
