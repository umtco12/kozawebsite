import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";

export type ContentRow = {
  key: string;
  value: string;
};

let database: InstanceType<typeof Database> | undefined;

function databasePath() {
  return resolve(
    process.env.KOZA_DB_PATH ?? resolve(process.cwd(), "data/koza.sqlite"),
  );
}

export function getDb() {
  if (!database) {
    const path = databasePath();
    mkdirSync(dirname(path), { recursive: true });
    database = new Database(path);
    database.pragma("journal_mode = WAL");
    database.pragma("busy_timeout = 8000");
    database.exec(`
      CREATE TABLE IF NOT EXISTS content_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
  }

  return database;
}

export function getContentRows(): ContentRow[] {
  return getDb()
    .prepare("SELECT key, value FROM content_items ORDER BY key")
    .all() as ContentRow[];
}

export function upsertContentItem(key: string, value: unknown) {
  getDb()
    .prepare(`
      INSERT INTO content_items (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `)
    .run(key, JSON.stringify(value), Date.now());
}
