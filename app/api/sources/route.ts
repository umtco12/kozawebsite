import { getNewsSource, listNewsSources, saveNewsSource } from "../../../db";
import { validateAgencySource } from "../../../db/agency-model.mjs";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter", "viewer"]);
  if (auth.response) return auth.response;
  return Response.json({ sources: listNewsSources() });
}

async function persist(request: Request, updating: boolean) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  const payload = await request.json();
  if (updating && !getNewsSource(Number(payload.id))) return Response.json({ error: "Kaynak bulunamadı." }, { status: 404 });
  const validation = validateAgencySource(payload);
  if (!validation.valid) return Response.json({ error: "Ajans bağlantısı alanlarını kontrol edin.", fields: validation.errors }, { status: 400 });
  try {
    const source = saveNewsSource({ ...validation.value, id: updating ? Number(payload.id) : undefined }, auth.user!.fullName);
    return Response.json({ ok: true, source }, { status: updating ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE constraint failed")) return Response.json({ error: "Bu ajans adresi daha önce eklenmiş." }, { status: 409 });
    return Response.json({ error: "Ajans bağlantısı kaydedilemedi." }, { status: 503 });
  }
}

export async function POST(request: Request) { return persist(request, false); }
export async function PATCH(request: Request) { return persist(request, true); }
