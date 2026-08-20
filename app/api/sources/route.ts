import { addNewsSource, listNewsSources } from "../../../db";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) { const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter", "viewer"]); if (auth.response) return auth.response; return Response.json({ sources: listNewsSources() }); }

export async function POST(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  const payload = await request.json() as { name?: string; url?: string; type?: string };
  if (!payload.name?.trim() || !payload.url?.trim()) return Response.json({ error: "Kaynak adı ve URL zorunlu" }, { status: 400 });
  try {
    const url = new URL(payload.url);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("protocol");
    const id = addNewsSource({ name: payload.name, url: url.toString(), type: payload.type });
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("UNIQUE constraint failed")) return Response.json({ error: "Bu kaynak daha önce eklenmiş" }, { status: 409 });
    return Response.json({ error: "Geçerli bir http/https kaynak adresi girin" }, { status: 400 });
  }
}
