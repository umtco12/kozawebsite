import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { slugify } from "./article-model.mjs";
import { seedArticles, seedSources } from "./seed";

export type ContentRow = { key: string; value: string };
export type ArticleStatus = "draft" | "review" | "scheduled" | "published";
export type ArticleRecord = { id: number; slug: string; title: string; spot: string; body: string; category: string; status: ArticleStatus; heroImage: string; imageAlt: string; videoUrl: string; author: string; sourceName: string; sourceUrl: string; seoTitle: string; seoDescription: string; isBreaking: number; isFeatured: number; publishedAt: number | null; scheduledAt: number | null; createdAt: number; updatedAt: number };
export type ArticleInput = Omit<ArticleRecord, "id" | "createdAt" | "updatedAt" | "publishedAt" | "scheduledAt"> & { id?: number; publishedAt?: number | string | null; scheduledAt?: number | string | null };
export type NewsSource = { id: number; name: string; url: string; type: string; active: number; lastCheckedAt: number | null; createdAt: number };

let database: InstanceType<typeof Database> | undefined;
function databasePath() { return resolve(process.env.KOZA_DB_PATH ?? resolve(process.cwd(), "data/koza.sqlite")); }
function mapArticle(row: Record<string, unknown>): ArticleRecord { return { id: Number(row.id), slug: String(row.slug), title: String(row.title), spot: String(row.spot), body: String(row.body), category: String(row.category), status: row.status as ArticleStatus, heroImage: String(row.hero_image), imageAlt: String(row.image_alt), videoUrl: String(row.video_url), author: String(row.author), sourceName: String(row.source_name), sourceUrl: String(row.source_url), seoTitle: String(row.seo_title), seoDescription: String(row.seo_description), isBreaking: Number(row.is_breaking), isFeatured: Number(row.is_featured), publishedAt: row.published_at == null ? null : Number(row.published_at), scheduledAt: row.scheduled_at == null ? null : Number(row.scheduled_at), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at) }; }

function ensureSchema(db: InstanceType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_items (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, spot TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft','review','scheduled','published')), hero_image TEXT NOT NULL DEFAULT '', image_alt TEXT NOT NULL DEFAULT '', video_url TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'Koza TV Haber Merkezi', source_name TEXT NOT NULL DEFAULT 'Koza TV', source_url TEXT NOT NULL DEFAULT '', seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '',
      is_breaking INTEGER NOT NULL DEFAULT 0 CHECK (is_breaking IN (0,1)), is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)), published_at INTEGER, scheduled_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS news_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE, type TEXT NOT NULL DEFAULT 'website', active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)), last_checked_at INTEGER, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_category_status ON articles(category, status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured, status, published_at DESC) WHERE is_featured = 1;
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
  `);
  const articleCount = Number((db.prepare("SELECT COUNT(*) AS count FROM articles").get() as { count: number }).count);
  if (articleCount === 0) {
    const now = Date.now();
    const insert = db.prepare(`INSERT INTO articles (slug,title,spot,body,category,status,hero_image,image_alt,video_url,author,source_name,source_url,seo_title,seo_description,is_breaking,is_featured,published_at,scheduled_at,created_at,updated_at) VALUES (@slug,@title,@spot,@body,@category,@status,@heroImage,@imageAlt,'',@author,@sourceName,@sourceUrl,@title,@spot,@isBreaking,@isFeatured,@publishedAt,NULL,@createdAt,@createdAt)`);
    db.transaction(() => { for (const article of seedArticles) insert.run({ ...article, publishedAt: article.status === "published" ? now - article.publishedOffsetMinutes * 60_000 : null, createdAt: now - Math.max(article.publishedOffsetMinutes, 1) * 60_000 }); })();
  }
  const sourceCount = Number((db.prepare("SELECT COUNT(*) AS count FROM news_sources").get() as { count: number }).count);
  if (sourceCount === 0) { const insert = db.prepare("INSERT INTO news_sources (name,url,type,active,last_checked_at,created_at) VALUES (?,?,?,1,NULL,?)"); db.transaction(() => { for (const source of seedSources) insert.run(source.name, source.url, source.type, Date.now()); })(); }
  db.pragma("optimize");
}

export function getDb() { if (!database) { const path = databasePath(); mkdirSync(dirname(path), { recursive: true }); database = new Database(path); database.pragma("journal_mode = WAL"); database.pragma("foreign_keys = ON"); database.pragma("busy_timeout = 8000"); ensureSchema(database); } return database; }
export function getContentRows(): ContentRow[] { return getDb().prepare("SELECT key,value FROM content_items ORDER BY key").all() as ContentRow[]; }
export function upsertContentItem(key: string, value: unknown) { getDb().prepare("INSERT INTO content_items (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(key, JSON.stringify(value), Date.now()); }

export function listArticles(options: { status?: ArticleStatus; category?: string; limit?: number } = {}) { const where: string[] = []; const params: unknown[] = []; if (options.status) { where.push("status = ?"); params.push(options.status); } if (options.category) { where.push("category = ?"); params.push(options.category); } const limit = Math.min(Math.max(options.limit ?? 50, 1), 100); const rows = getDb().prepare(`SELECT * FROM articles ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY COALESCE(published_at,scheduled_at,updated_at) DESC LIMIT ?`).all(...params, limit) as Record<string, unknown>[]; return rows.map(mapArticle); }
export function listPublishedArticles(limit = 30) { return listArticles({ status: "published", limit }); }
export function getArticleBySlug(slug: string) { const row = getDb().prepare("SELECT * FROM articles WHERE slug=? AND status='published'").get(slug) as Record<string, unknown> | undefined; return row ? mapArticle(row) : null; }

export function saveArticle(input: ArticleInput, actor = "Yayın Yönetmeni") {
  const db = getDb(); const now = Date.now(); const slug = input.slug || slugify(input.title); const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt).getTime() : null; const publishedAt = input.status === "published" ? (input.publishedAt ? new Date(input.publishedAt).getTime() : now) : null;
  const values = { ...input, slug, scheduledAt, publishedAt, heroImage: input.heroImage || "/news/gundem.jpg", imageAlt: input.imageAlt || input.title, videoUrl: input.videoUrl || "", author: input.author || "Koza TV Haber Merkezi", sourceName: input.sourceName || "Koza TV", sourceUrl: input.sourceUrl || "", seoTitle: input.seoTitle || input.title, seoDescription: input.seoDescription || input.spot, isBreaking: input.isBreaking ? 1 : 0, isFeatured: input.isFeatured ? 1 : 0, now };
  const transaction = db.transaction(() => { let id = input.id; if (id) { db.prepare(`UPDATE articles SET slug=@slug,title=@title,spot=@spot,body=@body,category=@category,status=@status,hero_image=@heroImage,image_alt=@imageAlt,video_url=@videoUrl,author=@author,source_name=@sourceName,source_url=@sourceUrl,seo_title=@seoTitle,seo_description=@seoDescription,is_breaking=@isBreaking,is_featured=@isFeatured,published_at=@publishedAt,scheduled_at=@scheduledAt,updated_at=@now WHERE id=@id`).run(values); } else { const result = db.prepare(`INSERT INTO articles (slug,title,spot,body,category,status,hero_image,image_alt,video_url,author,source_name,source_url,seo_title,seo_description,is_breaking,is_featured,published_at,scheduled_at,created_at,updated_at) VALUES (@slug,@title,@spot,@body,@category,@status,@heroImage,@imageAlt,@videoUrl,@author,@sourceName,@sourceUrl,@seoTitle,@seoDescription,@isBreaking,@isFeatured,@publishedAt,@scheduledAt,@now,@now)`).run(values); id = Number(result.lastInsertRowid); } db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,?,?,?,?)").run(id, input.status === "published" ? "publish" : "save", actor, JSON.stringify({ status: input.status, title: input.title }), now); return id!; });
  const id = transaction(); return mapArticle(getDb().prepare("SELECT * FROM articles WHERE id=?").get(id) as Record<string, unknown>);
}

export function listNewsSources() { return getDb().prepare("SELECT id,name,url,type,active,last_checked_at AS lastCheckedAt,created_at AS createdAt FROM news_sources ORDER BY active DESC,name").all() as NewsSource[]; }
export function addNewsSource(input: { name: string; url: string; type?: string }) { const result = getDb().prepare("INSERT INTO news_sources (name,url,type,active,last_checked_at,created_at) VALUES (?,?,?,1,NULL,?)").run(input.name.trim(), input.url.trim(), input.type || "website", Date.now()); return Number(result.lastInsertRowid); }
export function getArticleStats() { return getDb().prepare("SELECT COUNT(*) AS total,SUM(status='published') AS published,SUM(status='draft') AS draft,SUM(status='review') AS review,SUM(status='scheduled') AS scheduled FROM articles").get() as { total: number; published: number; draft: number; review: number; scheduled: number }; }
