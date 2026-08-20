import { createHash } from "node:crypto";
import { mkdir, readFile, statfs, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const acceptedTypes: Record<string, { extension: string; signature: (buffer: Buffer) => boolean }> = {
  "image/jpeg": { extension: "jpg", signature: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { extension: "png", signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { extension: "webp", signature: (buffer) => buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP" },
  "image/gif": { extension: "gif", signature: (buffer) => ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString()) },
};

export function mediaRoot() {
  const databaseSibling = process.env.KOZA_DB_PATH ? resolve(dirname(process.env.KOZA_DB_PATH), "media") : resolve(process.cwd(), "data/media");
  return resolve(process.env.KOZA_MEDIA_PATH ?? databaseSibling);
}

export function validateImage(buffer: Buffer, mimeType: string) {
  if (!buffer.length) return "Boş dosya yüklenemez.";
  if (buffer.length > MAX_IMAGE_BYTES) return "Görsel en fazla 12 MB olabilir.";
  const accepted = acceptedTypes[mimeType];
  if (!accepted || !accepted.signature(buffer)) return "Yalnızca doğrulanmış JPG, PNG, WebP veya GIF görselleri yüklenebilir.";
  return null;
}

export async function storeImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const error = validateImage(buffer, file.type);
  if (error) throw new Error(error);
  const accepted = acceptedTypes[file.type];
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `${createHash("sha256").update(buffer).digest("hex").slice(0, 32)}.${accepted.extension}`;
  const storageKey = `${folder}/${filename}`;
  const directory = resolve(mediaRoot(), folder);
  await mkdir(directory, { recursive: true });
  const disk = await statfs(directory);
  const availableBytes = Number(disk.bavail) * Number(disk.bsize);
  if (availableBytes - buffer.length < 1024 * 1024 * 1024) throw new Error("Sunucuda ayrılması gereken 1 GB güvenlik alanı nedeniyle görsel yüklenemedi.");
  try { await writeFile(resolve(directory, filename), buffer, { flag: "wx" }); } catch (writeError) { if ((writeError as NodeJS.ErrnoException).code !== "EEXIST") throw writeError; }
  return { storageKey, publicUrl: `/media/${storageKey}`, mimeType: file.type, sizeBytes: buffer.length };
}

export async function readStoredImage(parts: string[]) {
  const root = mediaRoot();
  const target = resolve(root, ...parts);
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error("Geçersiz medya yolu");
  const extension = target.split(".").pop()?.toLowerCase();
  const mimeType = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : extension === "gif" ? "image/gif" : null;
  if (!mimeType) throw new Error("Desteklenmeyen medya türü");
  return { bytes: await readFile(target), mimeType };
}
