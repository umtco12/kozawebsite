import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, statfs, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import sharpModule from "sharp";
import { RESPONSIVE_IMAGE_WIDTHS } from "../app/responsive-image-model.mjs";

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 150 * 1024 * 1024;
export const MAX_MEDIA_UPLOAD_BYTES = MAX_VIDEO_BYTES + 1024 * 1024;

type MediaKind = "image" | "video";
type AcceptedType = { kind: MediaKind; extension: string; signature: (buffer: Buffer) => boolean };

const acceptedTypes: Record<string, AcceptedType> = {
  "image/jpeg": { kind: "image", extension: "jpg", signature: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  "image/png": { kind: "image", extension: "png", signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { kind: "image", extension: "webp", signature: (buffer) => buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP" },
  "image/gif": { kind: "image", extension: "gif", signature: (buffer) => ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString()) },
  "video/mp4": { kind: "video", extension: "mp4", signature: (buffer) => buffer.length >= 12 && buffer.subarray(4, 8).toString() === "ftyp" },
  "video/webm": { kind: "video", extension: "webm", signature: (buffer) => buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
};

const typeByExtension = Object.fromEntries(Object.entries(acceptedTypes).map(([mimeType, accepted]) => [accepted.extension, mimeType]));
const MINIMUM_FREE_BYTES = 1024 * 1024 * 1024;
const variantPattern = /^([a-f0-9]{32})-(480|768|1024|1440)\.webp$/;
const variantJobs = new Map<string, Promise<string>>();
type SharpPipeline = {
  rotate: () => SharpPipeline;
  resize: (options: { width: number; fit: "inside"; withoutEnlargement: boolean }) => SharpPipeline;
  webp: (options: { quality: number; effort: number; smartSubsample: boolean }) => SharpPipeline;
  toBuffer: () => Promise<Buffer>;
};
const sharp = sharpModule as unknown as (input: string, options: { failOn: "error" }) => SharpPipeline;

export function mediaRoot() {
  const databaseSibling = process.env.KOZA_DB_PATH ? resolve(dirname(process.env.KOZA_DB_PATH), "media") : resolve(process.cwd(), "data/media");
  return resolve(process.env.KOZA_MEDIA_PATH ?? databaseSibling);
}

function detectMediaType(buffer: Buffer, kind?: MediaKind) {
  for (const [mimeType, accepted] of Object.entries(acceptedTypes)) {
    if ((!kind || accepted.kind === kind) && accepted.signature(buffer)) return mimeType;
  }
  return "";
}

export function validateImage(buffer: Buffer, mimeType: string) {
  if (!buffer.length) return "Boş dosya yüklenemez.";
  if (buffer.length > MAX_IMAGE_BYTES) return "Görsel en fazla 12 MB olabilir.";
  const accepted = acceptedTypes[mimeType];
  if (!accepted || accepted.kind !== "image" || !accepted.signature(buffer)) return "Yalnızca doğrulanmış JPG, PNG, WebP veya GIF görselleri yüklenebilir.";
  return null;
}

export function validateMedia(buffer: Buffer, mimeType: string) {
  if (!buffer.length) return "Boş dosya yüklenemez.";
  const accepted = acceptedTypes[mimeType];
  if (!accepted || !accepted.signature(buffer)) return "Yalnızca doğrulanmış JPG, PNG, WebP, GIF, MP4 veya WebM dosyaları yüklenebilir.";
  if (accepted.kind === "image" && buffer.length > MAX_IMAGE_BYTES) return "Görsel en fazla 12 MB olabilir.";
  if (accepted.kind === "video" && buffer.length > MAX_VIDEO_BYTES) return "Video en fazla 150 MB olabilir.";
  return null;
}

/* Kaynak sunucu yanlış ya da eksik content-type gönderdiğinde tür dosya imzasından bulunur. */
export function detectImageType(buffer: Buffer) {
  return detectMediaType(buffer, "image");
}

export function detectStoredMediaType(buffer: Buffer) {
  return detectMediaType(buffer);
}

async function storeFile(file: File, requiredKind?: MediaKind, remainingQuotaBytes = Number.POSITIVE_INFINITY) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const declared = acceptedTypes[file.type];
  const mimeType = declared?.signature(buffer) && (!requiredKind || declared.kind === requiredKind) ? file.type : detectMediaType(buffer, requiredKind);
  const error = requiredKind === "image" ? validateImage(buffer, mimeType) : validateMedia(buffer, mimeType);
  if (error) throw new Error(error);
  if (buffer.length > remainingQuotaBytes) throw new Error("Medya kütüphanesi için ayrılan toplam alan doldu.");
  const accepted = acceptedTypes[mimeType];
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `${createHash("sha256").update(buffer).digest("hex").slice(0, 32)}.${accepted.extension}`;
  const storageKey = `${folder}/${filename}`;
  const directory = resolve(mediaRoot(), folder);
  await mkdir(directory, { recursive: true });
  const disk = await statfs(directory);
  const availableBytes = Number(disk.bavail) * Number(disk.bsize);
  if (availableBytes - buffer.length < MINIMUM_FREE_BYTES) throw new Error("Sunucuda ayrılması gereken 1 GB güvenlik alanı nedeniyle medya yüklenemedi.");
  try { await writeFile(resolve(directory, filename), buffer, { flag: "wx" }); } catch (writeError) { if ((writeError as NodeJS.ErrnoException).code !== "EEXIST") throw writeError; }
  if (accepted.kind === "image" && mimeType !== "image/gif") await warmResponsiveImageVariants(storageKey);
  return { storageKey, publicUrl: `/media/${storageKey}`, mimeType, sizeBytes: buffer.length };
}

export async function storeImage(file: File) {
  return storeFile(file, "image");
}

export async function storeMedia(file: File, remainingQuotaBytes?: number) {
  return storeFile(file, undefined, remainingQuotaBytes);
}

function resolveStoredPath(parts: string[]) {
  const root = mediaRoot();
  const target = resolve(root, ...parts);
  if (target !== root && !target.startsWith(`${root}${sep}`)) throw new Error("Geçersiz medya yolu");
  return target;
}

function parseVariant(parts: string[]) {
  if (parts.length !== 4 || parts[0] !== "_variants" || !/^\d{4}$/.test(parts[1]) || !/^\d{2}$/.test(parts[2])) throw new Error("Geçersiz görsel türevi");
  const match = variantPattern.exec(parts[3]);
  if (!match) throw new Error("Geçersiz görsel türevi");
  return { year: parts[1], month: parts[2], hash: match[1], width: Number(match[2]) };
}

async function originalForVariant(parts: string[]) {
  const variant = parseVariant(parts);
  for (const extension of ["jpg", "png", "webp"]) {
    const path = resolveStoredPath([variant.year, variant.month, `${variant.hash}.${extension}`]);
    try {
      const details = await stat(path);
      if (details.isFile()) return { path, mimeType: typeByExtension[extension], sizeBytes: details.size, ...variant };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  throw new Error("Görselin orijinali bulunamadı");
}

async function generateResponsiveVariant(parts: string[]) {
  const target = resolveStoredPath(parts);
  try {
    const details = await stat(target);
    if (details.isFile()) return target;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const existingJob = variantJobs.get(target);
  if (existingJob) return existingJob;

  const job = (async () => {
    const original = await originalForVariant(parts);
    const output = await sharp(original.path, { failOn: "error" })
      .rotate()
      .resize({ width: original.width, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, effort: 4, smartSubsample: true })
      .toBuffer();
    const directory = dirname(target);
    await mkdir(directory, { recursive: true });
    const disk = await statfs(directory);
    const availableBytes = Number(disk.bavail) * Number(disk.bsize);
    if (availableBytes - output.length < MINIMUM_FREE_BYTES) throw new Error("Görsel türevi için 1 GB güvenlik alanı korunamadı");
    const temporary = `${target}.${process.pid}-${Date.now()}.tmp`;
    try {
      await writeFile(temporary, output, { flag: "wx" });
      await rename(temporary, target);
    } finally {
      await unlink(temporary).catch(() => undefined);
    }
    return target;
  })();
  variantJobs.set(target, job);
  try { return await job; } finally { variantJobs.delete(target); }
}

export async function warmResponsiveImageVariants(storageKey: string) {
  const match = /^(\d{4})\/(\d{2})\/([a-f0-9]{32})\.(?:jpe?g|png|webp)$/i.exec(storageKey);
  if (!match) return;
  for (const width of RESPONSIVE_IMAGE_WIDTHS) {
    try {
      await generateResponsiveVariant(["_variants", match[1], match[2], `${match[3]}-${width}.webp`]);
    } catch (error) {
      console.warn(`Görsel türevi hazırlanamadı (${storageKey}, ${width}px):`, error instanceof Error ? error.message : error);
    }
  }
}

export async function readStoredMedia(parts: string[]) {
  let path = resolveStoredPath(parts);
  let variantFallback = false;
  if (parts[0] === "_variants") {
    try {
      path = await generateResponsiveVariant(parts);
    } catch {
      path = (await originalForVariant(parts)).path;
      variantFallback = true;
    }
  }
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = typeByExtension[extension];
  if (!mimeType) throw new Error("Desteklenmeyen medya türü");
  const details = await stat(path);
  if (!details.isFile()) throw new Error("Medya bulunamadı");
  return { path, mimeType, sizeBytes: details.size, kind: acceptedTypes[mimeType].kind, variantFallback };
}

export async function readStoredImage(parts: string[]) {
  const media = await readStoredMedia(parts);
  if (media.kind !== "image") throw new Error("Desteklenmeyen görsel türü");
  return { bytes: await readFile(media.path), mimeType: media.mimeType };
}
