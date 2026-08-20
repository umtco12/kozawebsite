import { getMediaStats, listMediaAssets, saveMediaAsset } from "../../../db";
import { storeImage } from "../../../db/media-storage";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

function quotaBytes() { return Number(process.env.KOZA_MEDIA_QUOTA_BYTES ?? 10 * 1024 * 1024 * 1024); }
export async function GET(request: Request) { const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter", "viewer"]); if (auth.response) return auth.response; return Response.json({ media: listMediaAssets(), stats: { ...getMediaStats(), quotaBytes: quotaBytes() } }); }

export async function POST(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter"]);
  if (auth.response) return auth.response;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return Response.json({ error: "Yüklenecek görsel seçilmedi." }, { status: 400 });
    if (getMediaStats().totalBytes + file.size > quotaBytes()) return Response.json({ error: "Medya kütüphanesi için ayrılan toplam alan doldu." }, { status: 507 });
    const stored = await storeImage(file);
    const media = saveMediaAsset({ ...stored, originalName: file.name.slice(0, 180), altText: String(form.get("altText") ?? "").trim().slice(0, 240), credit: String(form.get("credit") ?? "").trim().slice(0, 160) }, auth.user!.fullName);
    return Response.json({ ok: true, media }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Görsel yüklenemedi." }, { status: 400 });
  }
}
