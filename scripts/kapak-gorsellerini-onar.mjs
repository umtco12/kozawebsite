#!/usr/bin/env node
/* Kapak görseli inememiş aktarım haberlerini onarır.

   Neden gerekli: Görseller veritabanında değil diskte tutulur; veritabanı yalnızca yolu saklar.
   Medya dizini yazılamadığında haber kaydı oluşur ama dosya yazılamaz ve haber yer tutucuya düşer.
   Dizin izni düzeltildikten sonra bu araç yalnız eksik görselleri yeniden indirir; haber metnini
   yeniden çekmez, var olan görselleri ellemez ve tekrar çalıştırmak güvenlidir.

   Kullanım (sunucuda, uygulama kullanıcısıyla):
     sudo -u kozatv node scripts/kapak-gorsellerini-onar.mjs [adet]

   Ortam değişkenleri `kozatv.service` ile aynıdır: KOZA_DB_PATH, KOZA_MEDIA_PATH.
*/

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { isAllowedSource, mapLegacyArticle } from "../db/import-model.mjs";

const require = createRequire(import.meta.url);

const PLACEHOLDER = "/news/gorsel-yok.svg";
const MAX_BYTES = 12 * 1024 * 1024;
const DELAY_MS = 200;
const TIMEOUT_MS = 20_000;

/* `db/media-storage.ts` ile aynı kurallar: içerik imzasıyla tür doğrulama, SHA-256 tabanlı ad,
   yıl/ay klasörü. Bu araç derlenmiş uygulamadan bağımsız çalıştığı için kurallar burada tekrar
   tanımlıdır; değiştirilirse iki taraf birlikte güncellenmelidir. */
const types = {
  "image/jpeg": { extension: "jpg", signature: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { extension: "png", signature: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  "image/webp": { extension: "webp", signature: (b) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  "image/gif": { extension: "gif", signature: (b) => ["GIF87a", "GIF89a"].includes(b.subarray(0, 6).toString()) },
};

function detectType(buffer) {
  for (const [mimeType, type] of Object.entries(types)) if (type.signature(buffer)) return mimeType;
  return "";
}

function openDatabase() {
  const path = resolve(process.env.KOZA_DB_PATH ?? resolve(process.cwd(), "data/koza.sqlite"));
  /* better-sqlite3 uygulamanın standalone paketinden yüklenir. */
  const candidates = [
    resolve(dirname(path), "../current/dist/standalone/node_modules/better-sqlite3"),
    resolve(process.cwd(), "dist/standalone/node_modules/better-sqlite3"),
    "better-sqlite3",
  ];
  for (const candidate of candidates) {
    try { return new (require(candidate))(path); } catch { /* sıradaki aday denenir */ }
  }
  throw new Error("better-sqlite3 bulunamadı.");
}

function mediaRoot() {
  const path = resolve(process.env.KOZA_DB_PATH ?? resolve(process.cwd(), "data/koza.sqlite"));
  return resolve(process.env.KOZA_MEDIA_PATH ?? resolve(dirname(path), "media"));
}

async function fetchBuffer(url, accept) {
  const response = await fetch(url, { headers: { "user-agent": "KozaTV-Gorsel-Onarim/1.0", accept }, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

async function storeImage(bytes, headerType) {
  const buffer = Buffer.from(bytes);
  if (!buffer.length) throw new Error("boş dosya");
  if (buffer.length > MAX_BYTES) throw new Error("12 MB üzeri");
  const mimeType = types[headerType]?.signature(buffer) ? headerType : detectType(buffer);
  if (!mimeType) throw new Error("tanınmayan görsel türü");
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `${createHash("sha256").update(buffer).digest("hex").slice(0, 32)}.${types[mimeType].extension}`;
  const directory = resolve(mediaRoot(), folder);
  await mkdir(directory, { recursive: true });
  try { await writeFile(resolve(directory, filename), buffer, { flag: "wx" }); }
  catch (error) { if (error.code !== "EEXIST") throw error; }
  return { storageKey: `${folder}/${filename}`, publicUrl: `/media/${folder}/${filename}`, mimeType, sizeBytes: buffer.length };
}

const limit = Number(process.argv[2] ?? 0) || Infinity;
const db = openDatabase();
const pending = db.prepare("SELECT id, source_url, image_alt FROM articles WHERE source_name='kozatv.com.tr' AND hero_image=? AND source_url<>'' ORDER BY published_at DESC").all(PLACEHOLDER);
const queue = pending.slice(0, limit === Infinity ? pending.length : limit);

console.log(`Kapak görseli eksik haber: ${pending.length} · bu çalıştırmada denenecek: ${queue.length}`);
console.log(`Medya dizini: ${mediaRoot()}`);

const updateArticle = db.prepare("UPDATE articles SET hero_image=?, updated_at=? WHERE id=?");
const insertMedia = db.prepare("INSERT INTO media_assets (storage_key,public_url,original_name,mime_type,size_bytes,alt_text,credit,created_at) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(storage_key) DO NOTHING");

let recovered = 0;
let index = 0;
const reasons = new Map();
const started = Date.now();

for (const article of queue) {
  index += 1;
  try {
    const page = await fetchBuffer(article.source_url, "text/html");
    const mapped = mapLegacyArticle({ url: article.source_url, html: await page.text() });
    const imageUrl = mapped.ok ? mapped.value.imageUrl : "";
    if (!imageUrl || !isAllowedSource(imageUrl)) throw new Error("kaynakta kapak görseli yok");

    const response = await fetchBuffer(imageUrl, "image/*");
    const headerType = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    const name = decodeURIComponent(new URL(imageUrl).pathname.split("/").pop() ?? "gorsel");
    const stored = await storeImage(await response.arrayBuffer(), headerType);

    const now = Date.now();
    insertMedia.run(stored.storageKey, stored.publicUrl, name.slice(0, 160), stored.mimeType, stored.sizeBytes, String(article.image_alt ?? "").slice(0, 200), "kozatv.com.tr", now);
    updateArticle.run(stored.publicUrl, now, article.id);
    recovered += 1;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "bilinmeyen hata";
    reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
  }

  if (index % 100 === 0 || index === queue.length) {
    const seconds = Math.round((Date.now() - started) / 1000);
    console.log(`  ${index}/${queue.length} · kurtarılan ${recovered} · ${seconds} sn`);
  }
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
}

console.log(`\nBitti: ${recovered} görsel kurtarıldı, ${queue.length - recovered} başarısız.`);
if (reasons.size) {
  console.log("Başarısızlık sebepleri:");
  for (const [reason, count] of [...reasons].sort((left, right) => right[1] - left[1])) console.log(`  ${count} × ${reason}`);
}
db.close();
