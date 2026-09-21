import Database from "better-sqlite3";
import pg from "pg";
import { createHash } from "node:crypto";
import { chmod, copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const { Client } = pg;
const sourcePath = resolve(process.env.KOZA_SQLITE_PATH || "");
const databaseUrl = process.env.KOZA_DATABASE_URL || process.env.DATABASE_URL || "";
const schemaPath = fileURLToPath(new URL("../db/postgres-schema.sql", import.meta.url));

if (!process.env.KOZA_SQLITE_PATH) throw new Error("KOZA_SQLITE_PATH tanımlanmalıdır.");
if (!databaseUrl) throw new Error("KOZA_DATABASE_URL tanımlanmalıdır.");

const tables = [
  "content_items",
  "news_sources",
  "categories",
  "media_assets",
  "admin_users",
  "articles",
  "admin_sessions",
  "article_revisions",
  "article_comments",
  "workflow_events",
  "audit_logs",
  "site_settings",
  "redirects",
  "import_items",
  "agency_items",
  "advertisements",
];

function quoteIdentifier(value) {
  if (!/^[a-z_][a-z0-9_]*$/.test(value)) throw new Error(`Güvensiz SQL tanımlayıcısı: ${value}`);
  return `"${value}"`;
}

function chunks(values, size) {
  const output = [];
  for (let index = 0; index < values.length; index += size) output.push(values.slice(index, index + size));
  return output;
}

const workingDirectory = await mkdtemp(join(tmpdir(), "kozatv-sqlite-migration-"));
const workingSourcePath = join(workingDirectory, "source.sqlite");
await copyFile(sourcePath, workingSourcePath);
await chmod(workingSourcePath, 0o600);
const source = new Database(workingSourcePath, { readonly: true, fileMustExist: true });
const target = new Client({ connectionString: databaseUrl, application_name: "kozatv-sqlite-migration" });
let targetConnected = false;

try {
  source.pragma("foreign_keys = ON");
  const integrity = source.pragma("quick_check", { simple: true });
  if (integrity !== "ok") throw new Error(`SQLite bütünlük kontrolü başarısız: ${integrity}`);

  await target.connect();
  targetConnected = true;
  await target.query("BEGIN");
  await target.query("SELECT pg_advisory_xact_lock(47120564906)");
  const existing = await target.query(`SELECT tablename FROM pg_tables WHERE schemaname='public'`);
  if (existing.rows.length) throw new Error(`Hedef veritabanı boş değil: ${existing.rows.map((row) => row.tablename).join(", ")}`);

  const schema = await readFile(schemaPath, "utf8");
  await target.query(schema);
  const counts = {};

  for (const table of tables) {
    const columns = source.prepare(`PRAGMA table_info(${quoteIdentifier(table)})`).all().map((column) => String(column.name));
    const targetColumns = await target.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1",
      [table],
    );
    const available = new Set(targetColumns.rows.map((row) => row.column_name));
    const missing = columns.filter((column) => !available.has(column));
    if (missing.length) throw new Error(`${table} hedef şemasında eksik kolonlar: ${missing.join(", ")}`);

    const rows = source.prepare(`SELECT * FROM ${quoteIdentifier(table)} ORDER BY rowid`).all();
    for (const batch of chunks(rows, 100)) {
      if (!batch.length) continue;
      const values = [];
      const tuples = batch.map((row) => {
        const placeholders = columns.map((column) => {
          values.push(row[column]);
          return `$${values.length}`;
        });
        return `(${placeholders.join(",")})`;
      });
      await target.query(
        `INSERT INTO ${quoteIdentifier(table)} (${columns.map(quoteIdentifier).join(",")}) VALUES ${tuples.join(",")}`,
        values,
      );
    }

    if (columns.includes("id")) {
      await target.query(
        `SELECT setval(pg_get_serial_sequence($1,'id'),COALESCE(MAX(id),1),(COUNT(*)>0)) FROM ${quoteIdentifier(table)}`,
        [table],
      );
    }
    const targetCount = Number((await target.query(`SELECT COUNT(*)::int AS total FROM ${quoteIdentifier(table)}`)).rows[0].total);
    if (targetCount !== rows.length) throw new Error(`${table} satır sayısı uyuşmuyor: SQLite=${rows.length}, PostgreSQL=${targetCount}`);
    counts[table] = targetCount;
  }

  await target.query("ANALYZE");
  await target.query("COMMIT");
  const sourceHash = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  console.log(JSON.stringify({ ok: true, sourceSha256: sourceHash, counts }, null, 2));
} catch (error) {
  if (targetConnected) await target.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  source.close();
  if (targetConnected) await target.end();
  await rm(workingDirectory, { recursive: true, force: true });
}
