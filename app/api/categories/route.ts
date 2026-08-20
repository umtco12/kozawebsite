import { listCategories, saveCategory, type CategoryInput } from "../../../db";
import { slugify } from "../../../db/article-model.mjs";
import { rejectExternalWrite } from "../write-access";

export const dynamic = "force-dynamic";

export async function GET() { return Response.json({ categories: listCategories() }); }

async function persist(request: Request) {
  const blocked = rejectExternalWrite(request);
  if (blocked) return blocked;
  try {
    const payload = await request.json() as CategoryInput;
    const name = String(payload.name ?? "").trim();
    const slug = slugify(payload.slug || name);
    if (name.length < 2 || !slug) return Response.json({ error: "Kategori adı en az 2 karakter olmalı." }, { status: 400 });
    if (payload.color && !/^#[0-9a-f]{6}$/i.test(payload.color)) return Response.json({ error: "Kategori rengi #RRGGBB biçiminde olmalı." }, { status: 400 });
    return Response.json({ ok: true, category: saveCategory({ ...payload, name, slug }) }, { status: payload.id ? 200 : 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE constraint failed")) return Response.json({ error: "Bu kategori adı veya URL'si zaten kullanılıyor." }, { status: 409 });
    return Response.json({ error: message || "Kategori kaydedilemedi." }, { status: 400 });
  }
}

export async function POST(request: Request) { return persist(request); }
export async function PATCH(request: Request) { return persist(request); }
