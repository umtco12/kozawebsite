import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { readStoredMedia } from "../../../db/media-storage";

export const dynamic = "force-dynamic";

function byteRange(value: string, size: number) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match) return null;
  if (!match[1] && !match[2]) return null;
  const suffix = !match[1] ? Number(match[2]) : null;
  if (suffix !== null && (!Number.isInteger(suffix) || suffix <= 0)) return null;
  const start = suffix !== null ? Math.max(size - suffix, 0) : Number(match[1]);
  const end = suffix !== null ? size - 1 : match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || start > end || start >= size) return null;
  return { start, end };
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const media = await readStoredMedia(path);
    const rangeHeader = request.headers.get("range");
    const range = rangeHeader ? byteRange(rangeHeader, media.sizeBytes) : null;
    if (rangeHeader && !range) return new Response(null, { status: 416, headers: { "content-range": `bytes */${media.sizeBytes}`, "accept-ranges": "bytes" } });
    const start = range?.start ?? 0;
    const end = range?.end ?? media.sizeBytes - 1;
    const headers: Record<string, string> = {
      "content-type": media.mimeType,
      "content-length": String(end - start + 1),
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
      "accept-ranges": "bytes",
    };
    if (range) headers["content-range"] = `bytes ${start}-${end}/${media.sizeBytes}`;
    const stream = Readable.toWeb(createReadStream(media.path, { start, end }));
    return new Response(stream as unknown as BodyInit, { status: range ? 206 : 200, headers });
  } catch {
    return new Response("Medya bulunamadı", { status: 404 });
  }
}
