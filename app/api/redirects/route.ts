import { deleteRedirect, listRedirects, recordRedirectCheck, saveRedirect, saveRedirectBatch } from "../../../db";
import { parseRedirectInventory, validateRedirect } from "../../../db/settings-model.mjs";
import { authorizeAdmin } from "../write-access";

type RedirectInput = { fromPath: string; toPath: string; kind: "permanent" | "temporary"; note?: string };

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor"]);
  if (auth.response) return auth.response;
  return Response.json({ redirects: listRedirects() });
}

export async function POST(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  try {
    const payload = await request.json() as { inventory?: string; fromPath?: string; toPath?: string; kind?: string; note?: string };

    /* Toplu envanter: her satırda "eski adres, yeni adres". */
    if (typeof payload.inventory === "string") {
      const { rows, invalid, duplicates } = parseRedirectInventory(payload.inventory);
      if (!rows.length) return Response.json({ error: "Geçerli eşleme satırı bulunamadı.", invalid }, { status: 400 });
      const created = saveRedirectBatch(rows as RedirectInput[], auth.user!.fullName);
      return Response.json({ ok: true, created, invalid, duplicates, redirects: listRedirects() }, { status: 201 });
    }

    const { value, errors, valid } = validateRedirect(payload);
    if (!valid) return Response.json({ error: "Adresler düzeltilmelidir.", fields: errors }, { status: 400 });
    return Response.json({ ok: true, redirect: saveRedirect(value as RedirectInput, auth.user!.fullName), redirects: listRedirects() }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Yönlendirme kaydedilemedi." }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  try {
    const payload = await request.json() as { id?: number; action?: string; fromPath?: string; toPath?: string; kind?: string; note?: string; active?: boolean };

    /* Hedef adreslerin gerçekten açıldığını kendi sunucumuz üzerinden doğrular. */
    if (payload.action === "check") {
      const origin = new URL(request.url).origin;
      const results = [];
      for (const redirect of listRedirects()) {
        let status = 0;
        try {
          const response = await fetch(`${origin}${redirect.toPath}`, { redirect: "manual", headers: { accept: "text/html" } });
          status = response.status;
        } catch {
          status = 0;
        }
        recordRedirectCheck(redirect.id, status);
        results.push({ id: redirect.id, toPath: redirect.toPath, status });
      }
      const broken = results.filter((item) => item.status !== 200);
      return Response.json({ ok: true, checked: results.length, broken, redirects: listRedirects() });
    }

    const id = Number(payload.id);
    if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Geçerli bir kayıt seçilmelidir." }, { status: 400 });
    if (payload.active !== undefined && payload.fromPath === undefined) {
      const current = listRedirects().find((item) => item.id === id);
      if (!current) return Response.json({ error: "Kayıt bulunamadı." }, { status: 404 });
      return Response.json({ ok: true, redirect: saveRedirect({ id, fromPath: current.fromPath, toPath: current.toPath, kind: current.kind, note: current.note, active: payload.active }, auth.user!.fullName), redirects: listRedirects() });
    }
    const { value, errors, valid } = validateRedirect(payload);
    if (!valid) return Response.json({ error: "Adresler düzeltilmelidir.", fields: errors }, { status: 400 });
    return Response.json({ ok: true, redirect: saveRedirect({ id, ...(value as RedirectInput), active: payload.active ?? true }, auth.user!.fullName), redirects: listRedirects() });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Yönlendirme güncellenemedi." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id < 1) return Response.json({ error: "Geçerli bir kayıt seçilmelidir." }, { status: 400 });
  if (!deleteRedirect(id, auth.user!.fullName)) return Response.json({ error: "Kayıt bulunamadı." }, { status: 404 });
  return Response.json({ ok: true, redirects: listRedirects() });
}
