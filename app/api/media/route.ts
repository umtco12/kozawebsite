import { getMediaStats, listMediaAssets, saveMediaAsset } from "../../../db";
import { MAX_MEDIA_UPLOAD_BYTES, storeMedia } from "../../../db/media-storage";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

function quotaBytes() { return Number(process.env.KOZA_MEDIA_QUOTA_BYTES ?? 10 * 1024 * 1024 * 1024); }
export async function GET(request: Request) { const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter", "viewer"]); if (auth.response) return auth.response; const url = new URL(request.url); const type = url.searchParams.get("type") || "all"; if (!["all", "image", "video"].includes(type)) return Response.json({ error: "Geçersiz medya türü." }, { status: 400 }); return Response.json({ media: listMediaAssets({ query: url.searchParams.get("q") ?? "", limit: Number(url.searchParams.get("limit") || 80), kind: type === "all" ? undefined : type as "image" | "video" }), stats: { ...getMediaStats(), quotaBytes: quotaBytes() } }); }

export async function POST(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter"]);
  if (auth.response) return auth.response;
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_MEDIA_UPLOAD_BYTES) return Response.json({ error: "Yükleme isteği izin verilen boyutu aşıyor." }, { status: 413 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Yüklenecek fotoğraf veya video seçilmedi." }, { status: 400 });
    const stored = await storeMedia(file, quotaBytes() - getMediaStats().totalBytes);
    const media = saveMediaAsset({ ...stored, originalName: file.name.slice(0, 180), altText: String(form.get("altText") ?? "").trim().slice(0, 240), credit: String(form.get("credit") ?? "").trim().slice(0, 160) }, auth.user!.fullName);
    return Response.json({ ok: true, media }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Medya yüklenemedi.";
    return Response.json({ error: message }, { status: /toplam alan doldu/.test(message) ? 507 : /en fazla|boyutu aşıyor/.test(message) ? 413 : 400 });
  }
}
