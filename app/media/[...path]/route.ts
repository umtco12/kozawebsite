import { readStoredImage } from "../../../db/media-storage";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const media = await readStoredImage(path);
    return new Response(media.bytes, { headers: { "content-type": media.mimeType, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
  } catch {
    return new Response("Medya bulunamadı", { status: 404 });
  }
}
