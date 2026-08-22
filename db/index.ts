import { mkdirSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { slugify } from "./article-model.mjs";
import { hashPassword, verifyPassword } from "./auth-model.mjs";
import { defaultSettings, normalizePath, normalizeSchedule, scheduleDefault } from "./settings-model.mjs";
import { seedArticles, seedCategories, seedSources } from "./seed";

export type ContentRow = { key: string; value: string };
export type ArticleStatus = "draft" | "review" | "scheduled" | "published";
export type WorkflowState = "reporter_draft" | "editor_review" | "changes_requested" | "approved" | "rejected" | "published" | "withdrawn";
export type ContentBlock = { id: string; type: "paragraph" | "heading" | "quote" | "list" | "image" | "video" | "embed"; content: string; caption?: string };
export type ArticleRecord = { id: number; slug: string; title: string; spot: string; body: string; blocks: ContentBlock[]; category: string; status: ArticleStatus; workflowState: WorkflowState; assignedTo: number | null; editVersion: number; correctionNote: string; withdrawnAt: number | null; heroImage: string; imageAlt: string; videoUrl: string; author: string; sourceName: string; sourceUrl: string; seoTitle: string; seoDescription: string; isBreaking: number; isFeatured: number; homepageOrder: number; publishedAt: number | null; scheduledAt: number | null; createdAt: number; updatedAt: number };
export type ArticleInput = Omit<ArticleRecord, "id" | "createdAt" | "updatedAt" | "publishedAt" | "scheduledAt"> & { id?: number; publishedAt?: number | string | null; scheduledAt?: number | string | null };
export type NewsSource = { id: number; name: string; url: string; type: string; active: number; lastCheckedAt: number | null; createdAt: number };
export type CategoryRecord = { id: number; name: string; slug: string; description: string; seoTitle: string; seoDescription: string; color: string; navOrder: number; isVisible: number; articleCount: number; createdAt: number; updatedAt: number };
export type CategoryInput = { id?: number; name: string; slug?: string; description?: string; seoTitle?: string; seoDescription?: string; color?: string; navOrder?: number; isVisible?: number | boolean };
export type MediaRecord = { id: number; storageKey: string; publicUrl: string; originalName: string; mimeType: string; sizeBytes: number; altText: string; credit: string; createdAt: number };
export type AdminRole = "admin" | "publisher" | "editor" | "reporter" | "viewer";
export type AdminUser = { id: number; email: string; fullName: string; role: AdminRole; active: number; mustChangePassword: number; failedAttempts: number; lockedUntil: number | null; lastLoginAt: number | null; createdAt: number; updatedAt: number };

let database: InstanceType<typeof Database> | undefined;
function databasePath() { return resolve(process.env.KOZA_DB_PATH ?? resolve(process.cwd(), "data/koza.sqlite")); }
function parseBlocks(value: unknown, body: string): ContentBlock[] { try { const blocks = JSON.parse(String(value || "[]")); if (Array.isArray(blocks) && blocks.length) return blocks; } catch { /* Eski veya bozuk blok JSON'u düz metin olarak korunur. */ } return [{ id: "legacy", type: "paragraph", content: body }]; }
function mapArticle(row: Record<string, unknown>): ArticleRecord { const body = String(row.body); return { id: Number(row.id), slug: String(row.slug), title: String(row.title), spot: String(row.spot), body, blocks: parseBlocks(row.content_blocks, body), category: String(row.category), status: row.status as ArticleStatus, workflowState: (row.workflow_state || (row.status === "published" ? "published" : "reporter_draft")) as WorkflowState, assignedTo: row.assigned_to == null ? null : Number(row.assigned_to), editVersion: Number(row.edit_version || 1), correctionNote: String(row.correction_note || ""), withdrawnAt: row.withdrawn_at == null ? null : Number(row.withdrawn_at), heroImage: String(row.hero_image), imageAlt: String(row.image_alt), videoUrl: String(row.video_url), author: String(row.author), sourceName: String(row.source_name), sourceUrl: String(row.source_url), seoTitle: String(row.seo_title), seoDescription: String(row.seo_description), isBreaking: Number(row.is_breaking), isFeatured: Number(row.is_featured), homepageOrder: Number(row.homepage_order ?? 100), publishedAt: row.published_at == null ? null : Number(row.published_at), scheduledAt: row.scheduled_at == null ? null : Number(row.scheduled_at), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at) }; }

function ensureColumn(db: InstanceType<typeof Database>, table: string, name: string, definition: string) { const columns = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]; if (!columns.some((column) => column.name === name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`); }

function ensureSchema(db: InstanceType<typeof Database>) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_items (id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL UNIQUE, value TEXT NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, spot TEXT NOT NULL, body TEXT NOT NULL, category TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('draft','review','scheduled','published')), hero_image TEXT NOT NULL DEFAULT '', image_alt TEXT NOT NULL DEFAULT '', video_url TEXT NOT NULL DEFAULT '',
      author TEXT NOT NULL DEFAULT 'Koza TV Haber Merkezi', source_name TEXT NOT NULL DEFAULT 'Koza TV', source_url TEXT NOT NULL DEFAULT '', seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '',
      is_breaking INTEGER NOT NULL DEFAULT 0 CHECK (is_breaking IN (0,1)), is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0,1)), homepage_order INTEGER NOT NULL DEFAULT 100, published_at INTEGER, scheduled_at INTEGER, content_blocks TEXT NOT NULL DEFAULT '[]', workflow_state TEXT NOT NULL DEFAULT 'reporter_draft', assigned_to INTEGER, edit_version INTEGER NOT NULL DEFAULT 1, correction_note TEXT NOT NULL DEFAULT '', withdrawn_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS news_sources (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE, type TEXT NOT NULL DEFAULT 'website', active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)), last_checked_at INTEGER, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, description TEXT NOT NULL DEFAULT '', seo_title TEXT NOT NULL DEFAULT '', seo_description TEXT NOT NULL DEFAULT '', color TEXT NOT NULL DEFAULT '#c92721', nav_order INTEGER NOT NULL DEFAULT 100, is_visible INTEGER NOT NULL DEFAULT 1 CHECK (is_visible IN (0,1)), created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS media_assets (id INTEGER PRIMARY KEY AUTOINCREMENT, storage_key TEXT NOT NULL UNIQUE, public_url TEXT NOT NULL UNIQUE, original_name TEXT NOT NULL, mime_type TEXT NOT NULL, size_bytes INTEGER NOT NULL CHECK (size_bytes > 0), alt_text TEXT NOT NULL DEFAULT '', credit TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS admin_users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL COLLATE NOCASE UNIQUE, full_name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin','publisher','editor','reporter','viewer')), active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)), must_change_password INTEGER NOT NULL DEFAULT 1 CHECK (must_change_password IN (0,1)), failed_attempts INTEGER NOT NULL DEFAULT 0, locked_until INTEGER, last_login_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS admin_sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL, last_seen_at INTEGER NOT NULL, user_agent TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS article_revisions (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE, version INTEGER NOT NULL, snapshot TEXT NOT NULL, actor_id INTEGER, actor_name TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL, UNIQUE(article_id,version));
    CREATE TABLE IF NOT EXISTS article_comments (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES admin_users(id), author_name TEXT NOT NULL, body TEXT NOT NULL, resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0,1)), created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS workflow_events (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE, action TEXT NOT NULL, from_state TEXT NOT NULL, to_state TEXT NOT NULL, actor_id INTEGER NOT NULL REFERENCES admin_users(id), actor_name TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, entity_type TEXT NOT NULL, entity_id INTEGER NOT NULL, action TEXT NOT NULL, actor TEXT NOT NULL, detail TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS idx_articles_status_published ON articles(status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_category_status ON articles(category, status, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured, status, published_at DESC) WHERE is_featured = 1;
    CREATE INDEX IF NOT EXISTS idx_categories_visible_order ON categories(is_visible, nav_order, name);
    CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_expiry ON admin_sessions(user_id, expires_at);
    CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_revisions_article_version ON article_revisions(article_id,version DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_article_created ON article_comments(article_id,created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_workflow_events_article ON workflow_events(article_id,created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id, created_at DESC);
    CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL, updated_by TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS redirects (
      id INTEGER PRIMARY KEY AUTOINCREMENT, from_path TEXT NOT NULL UNIQUE, to_path TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'permanent' CHECK (kind IN ('permanent','temporary')), note TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)), hits INTEGER NOT NULL DEFAULT 0, last_hit_at INTEGER,
      last_check_status INTEGER, last_checked_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_redirects_active ON redirects(active, from_path);
  `);
  ensureColumn(db, "articles", "content_blocks", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "articles", "workflow_state", "TEXT NOT NULL DEFAULT 'reporter_draft'");
  ensureColumn(db, "articles", "assigned_to", "INTEGER");
  ensureColumn(db, "articles", "edit_version", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(db, "articles", "correction_note", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "articles", "withdrawn_at", "INTEGER");
  ensureColumn(db, "articles", "homepage_order", "INTEGER NOT NULL DEFAULT 100");
  db.exec("CREATE INDEX IF NOT EXISTS idx_workflow_state_assignee ON articles(workflow_state,assigned_to,updated_at DESC)");
  const articleCount = Number((db.prepare("SELECT COUNT(*) AS count FROM articles").get() as { count: number }).count);
  if (articleCount === 0) {
    const now = Date.now();
    const insert = db.prepare(`INSERT INTO articles (slug,title,spot,body,category,status,hero_image,image_alt,video_url,author,source_name,source_url,seo_title,seo_description,is_breaking,is_featured,published_at,scheduled_at,created_at,updated_at) VALUES (@slug,@title,@spot,@body,@category,@status,@heroImage,@imageAlt,'',@author,@sourceName,@sourceUrl,@title,@spot,@isBreaking,@isFeatured,@publishedAt,NULL,@createdAt,@createdAt)`);
    db.transaction(() => { for (const article of seedArticles) insert.run({ ...article, publishedAt: article.status === "published" ? now - article.publishedOffsetMinutes * 60_000 : null, createdAt: now - Math.max(article.publishedOffsetMinutes, 1) * 60_000 }); })();
  }
  const sourceCount = Number((db.prepare("SELECT COUNT(*) AS count FROM news_sources").get() as { count: number }).count);
  if (sourceCount === 0) { const insert = db.prepare("INSERT INTO news_sources (name,url,type,active,last_checked_at,created_at) VALUES (?,?,?,1,NULL,?)"); db.transaction(() => { for (const source of seedSources) insert.run(source.name, source.url, source.type, Date.now()); })(); }
  const categoryCount = Number((db.prepare("SELECT COUNT(*) AS count FROM categories").get() as { count: number }).count);
  if (categoryCount === 0) { const insert = db.prepare("INSERT INTO categories (name,slug,description,seo_title,seo_description,color,nav_order,is_visible,created_at,updated_at) VALUES (@name,@slug,@description,@name,@description,@color,@navOrder,1,@now,@now)"); db.transaction(() => { for (const category of seedCategories) insert.run({ ...category, now: Date.now() }); })(); }
  const adminCount = Number((db.prepare("SELECT COUNT(*) AS count FROM admin_users").get() as { count: number }).count);
  if (adminCount === 0 && process.env.KOZA_BOOTSTRAP_ADMIN_EMAIL && process.env.KOZA_BOOTSTRAP_ADMIN_PASSWORD) { const now = Date.now(); db.prepare("INSERT INTO admin_users (email,full_name,password_hash,role,active,must_change_password,failed_attempts,locked_until,last_login_at,created_at,updated_at) VALUES (?,?,?,'admin',1,?,0,NULL,NULL,?,?)").run(process.env.KOZA_BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase(), process.env.KOZA_BOOTSTRAP_ADMIN_NAME?.trim() || "Koza TV Yöneticisi", hashPassword(process.env.KOZA_BOOTSTRAP_ADMIN_PASSWORD), process.env.KOZA_BOOTSTRAP_ADMIN_FORCE_CHANGE === "0" ? 0 : 1, now, now); }
  db.pragma("optimize");
}

export function getDb() { if (!database) { const path = databasePath(); mkdirSync(dirname(path), { recursive: true }); database = new Database(path); database.pragma("journal_mode = WAL"); database.pragma("foreign_keys = ON"); database.pragma("busy_timeout = 8000"); ensureSchema(database); } return database; }
export function getContentRows(): ContentRow[] { return getDb().prepare("SELECT key,value FROM content_items ORDER BY key").all() as ContentRow[]; }
export function upsertContentItem(key: string, value: unknown) { getDb().prepare("INSERT INTO content_items (key,value,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at").run(key, JSON.stringify(value), Date.now()); }

export function listArticles(options: { status?: ArticleStatus; category?: string; limit?: number } = {}) { const where: string[] = []; const params: unknown[] = []; if (options.status) { where.push("status = ?"); params.push(options.status); } if (options.category) { where.push("category = ?"); params.push(options.category); } const limit = Math.min(Math.max(options.limit ?? 50, 1), 100); const rows = getDb().prepare(`SELECT * FROM articles ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY COALESCE(published_at,scheduled_at,updated_at) DESC LIMIT ?`).all(...params, limit) as Record<string, unknown>[]; return rows.map(mapArticle); }
function publishDueArticles() { const now = Date.now(); getDb().prepare("UPDATE articles SET status='published',workflow_state='published',published_at=COALESCE(published_at,scheduled_at,?),edit_version=edit_version+1,updated_at=? WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at<=?").run(now, now, now); }
export function listPublishedArticles(limit = 30) { publishDueArticles(); const safeLimit = Math.min(Math.max(limit, 1), 100); return (getDb().prepare("SELECT * FROM articles WHERE status='published' ORDER BY is_featured DESC,homepage_order ASC,published_at DESC LIMIT ?").all(safeLimit) as Record<string, unknown>[]).map(mapArticle); }
export function getArticleBySlug(slug: string) { publishDueArticles(); const row = getDb().prepare("SELECT * FROM articles WHERE slug=? AND status='published'").get(slug) as Record<string, unknown> | undefined; return row ? mapArticle(row) : null; }

export function saveArticle(input: ArticleInput, actor = "Yayın Yönetmeni") {
  const db = getDb(); const now = Date.now(); const slug = input.slug || slugify(input.title); const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt).getTime() : null; const publishedAt = input.status === "published" ? (input.publishedAt ? new Date(input.publishedAt).getTime() : now) : null;
  const blocks = Array.isArray(input.blocks) && input.blocks.length ? input.blocks : [{ id: randomBytes(6).toString("hex"), type: "paragraph" as const, content: input.body }];
  const values = { ...input, slug, scheduledAt, publishedAt, contentBlocks: JSON.stringify(blocks), heroImage: input.heroImage || "/news/gundem.jpg", imageAlt: input.imageAlt || input.title, videoUrl: input.videoUrl || "", author: input.author || "Koza TV Haber Merkezi", sourceName: input.sourceName || "Koza TV", sourceUrl: input.sourceUrl || "", seoTitle: input.seoTitle || input.title, seoDescription: input.seoDescription || input.spot, isBreaking: input.isBreaking ? 1 : 0, isFeatured: input.isFeatured ? 1 : 0, homepageOrder: Math.min(Math.max(Number(input.homepageOrder ?? 100), 1), 999), now };
  if (input.status === "published" || input.status === "scheduled") { const workflow = input.id ? db.prepare("SELECT workflow_state AS workflowState FROM articles WHERE id=?").get(input.id) as { workflowState: WorkflowState } | undefined : undefined; if (!workflow || !["approved", "published"].includes(workflow.workflowState)) throw new Error("WORKFLOW_APPROVAL_REQUIRED"); }
  const transaction = db.transaction(() => { let id = input.id; if (id) { const expectedVersion = Number(input.editVersion || 1); const result = db.prepare(`UPDATE articles SET slug=@slug,title=@title,spot=@spot,body=@body,content_blocks=@contentBlocks,category=@category,status=@status,hero_image=@heroImage,image_alt=@imageAlt,video_url=@videoUrl,author=@author,source_name=@sourceName,source_url=@sourceUrl,seo_title=@seoTitle,seo_description=@seoDescription,is_breaking=@isBreaking,is_featured=@isFeatured,homepage_order=@homepageOrder,published_at=@publishedAt,scheduled_at=@scheduledAt,edit_version=edit_version+1,updated_at=@now WHERE id=@id AND edit_version=@expectedVersion`).run({ ...values, expectedVersion }); if (!result.changes) throw new Error("EDIT_CONFLICT"); } else { const result = db.prepare(`INSERT INTO articles (slug,title,spot,body,content_blocks,category,status,workflow_state,hero_image,image_alt,video_url,author,source_name,source_url,seo_title,seo_description,is_breaking,is_featured,homepage_order,published_at,scheduled_at,created_at,updated_at) VALUES (@slug,@title,@spot,@body,@contentBlocks,@category,@status,'reporter_draft',@heroImage,@imageAlt,@videoUrl,@author,@sourceName,@sourceUrl,@seoTitle,@seoDescription,@isBreaking,@isFeatured,@homepageOrder,@publishedAt,@scheduledAt,@now,@now)`).run(values); id = Number(result.lastInsertRowid); } const article = mapArticle(db.prepare("SELECT * FROM articles WHERE id=?").get(id) as Record<string, unknown>); db.prepare("INSERT INTO article_revisions (article_id,version,snapshot,actor_id,actor_name,reason,created_at) VALUES (?,?,?,NULL,?,'save',?)").run(id, article.editVersion, JSON.stringify(article), actor, now); db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,?,?,?,?)").run(id, input.status === "published" ? "publish" : "save", actor, JSON.stringify({ status: input.status, title: input.title, version: article.editVersion }), now); return id!; });
  const id = transaction(); return mapArticle(getDb().prepare("SELECT * FROM articles WHERE id=?").get(id) as Record<string, unknown>);
}

export function listArticleRevisions(articleId: number) { return getDb().prepare("SELECT id,article_id AS articleId,version,actor_name AS actorName,reason,created_at AS createdAt FROM article_revisions WHERE article_id=? ORDER BY version DESC LIMIT 50").all(articleId); }
export function restoreArticleRevision(articleId: number, revisionId: number, actor: AdminUser) { const db = getDb(); const row = db.prepare("SELECT snapshot FROM article_revisions WHERE id=? AND article_id=?").get(revisionId, articleId) as { snapshot: string } | undefined; if (!row) throw new Error("REVISION_NOT_FOUND"); const snapshot = JSON.parse(row.snapshot) as ArticleRecord; const current = mapArticle(db.prepare("SELECT * FROM articles WHERE id=?").get(articleId) as Record<string, unknown>); return saveArticle({ ...snapshot, id: articleId, editVersion: current.editVersion }, actor.fullName); }
export function listArticleComments(articleId: number) { return getDb().prepare("SELECT id,article_id AS articleId,user_id AS userId,author_name AS authorName,body,resolved,created_at AS createdAt FROM article_comments WHERE article_id=? ORDER BY created_at DESC").all(articleId); }
export function addArticleComment(articleId: number, body: string, actor: AdminUser) { const value = body.trim().slice(0, 2000); if (value.length < 2) throw new Error("COMMENT_REQUIRED"); const result = getDb().prepare("INSERT INTO article_comments (article_id,user_id,author_name,body,resolved,created_at) VALUES (?,?,?,?,0,?)").run(articleId, actor.id, actor.fullName, value, Date.now()); return Number(result.lastInsertRowid); }
export function listWorkflowEvents(articleId: number) { return getDb().prepare("SELECT id,action,from_state AS fromState,to_state AS toState,actor_name AS actorName,note,created_at AS createdAt FROM workflow_events WHERE article_id=? ORDER BY created_at DESC LIMIT 100").all(articleId); }
export function getEditorialReport() { const since = Date.now() - 30 * 86_400_000; return getDb().prepare("SELECT actor_name AS actorName,COUNT(*) AS total,SUM(action='publish') AS published,SUM(action='approve') AS approved,SUM(action='request_changes') AS changesRequested,SUM(action='reject') AS rejected FROM workflow_events WHERE created_at>=? GROUP BY actor_id,actor_name ORDER BY total DESC LIMIT 20").all(since); }

function publicationChecklist(article: ArticleRecord) { const missing: string[] = []; if (article.title.trim().length < 12) missing.push("başlık"); if (article.spot.trim().length < 24) missing.push("spot"); if (article.body.trim().length < 80) missing.push("haber metni"); if (!article.heroImage.trim()) missing.push("kapak görseli"); if (!article.imageAlt.trim()) missing.push("görsel alt metni"); if (!article.sourceName.trim()) missing.push("kaynak"); if (missing.length) throw new Error(`YAYIN_KONTROL_LISTESI: ${missing.join(", ")}`); }

export function applyWorkflowAction(articleId: number, action: string, note: string, actor: AdminUser, assigneeId?: number | null) {
  const db = getDb(); const now = Date.now(); const row = db.prepare("SELECT * FROM articles WHERE id=?").get(articleId) as Record<string, unknown> | undefined; if (!row) throw new Error("ARTICLE_NOT_FOUND"); const article = mapArticle(row);
  const transitions: Record<string, WorkflowState> = { submit_review: "editor_review", request_changes: "changes_requested", approve: "approved", reject: "rejected", publish: "published", withdraw: "withdrawn", reopen: "reporter_draft" };
  if (action === "assign") { db.prepare("UPDATE articles SET assigned_to=?,updated_at=? WHERE id=?").run(assigneeId ?? null, now, articleId); }
  else if (action === "correction") { if (article.workflowState !== "published") throw new Error("INVALID_TRANSITION"); db.prepare("UPDATE articles SET correction_note=?,edit_version=edit_version+1,updated_at=? WHERE id=?").run(note.trim().slice(0, 1000), now, articleId); db.prepare("INSERT INTO workflow_events (article_id,action,from_state,to_state,actor_id,actor_name,note,created_at) VALUES (?,?,?,?,?,?,?,?)").run(articleId, action, article.workflowState, article.workflowState, actor.id, actor.fullName, note.trim().slice(0, 1000), now); }
  else { const next = transitions[action]; if (!next) throw new Error("INVALID_ACTION"); const allowedFrom: Record<string, WorkflowState[]> = { submit_review: ["reporter_draft", "changes_requested", "rejected"], request_changes: ["editor_review"], approve: ["editor_review"], reject: ["editor_review", "approved"], publish: ["approved"], withdraw: ["published"], reopen: ["rejected", "withdrawn"] }; if (!allowedFrom[action]?.includes(article.workflowState)) throw new Error("INVALID_TRANSITION"); if (["approve", "publish"].includes(action)) publicationChecklist(article); const status: ArticleStatus = next === "published" ? "published" : next === "editor_review" ? "review" : "draft"; db.prepare("UPDATE articles SET workflow_state=?,status=?,correction_note=CASE WHEN ?='withdrawn' THEN ? ELSE correction_note END,withdrawn_at=CASE WHEN ?='withdrawn' THEN ? ELSE NULL END,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END,edit_version=edit_version+1,updated_at=? WHERE id=?").run(next, status, next, note.trim(), next, now, next, now, now, articleId); db.prepare("INSERT INTO workflow_events (article_id,action,from_state,to_state,actor_id,actor_name,note,created_at) VALUES (?,?,?,?,?,?,?,?)").run(articleId, action, article.workflowState, next, actor.id, actor.fullName, note.trim().slice(0, 1000), now); }
  db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,?,?,?,?)").run(articleId, action, actor.fullName, JSON.stringify({ note, assigneeId }), now); return mapArticle(db.prepare("SELECT * FROM articles WHERE id=?").get(articleId) as Record<string, unknown>);
}

export function listNewsSources() { return getDb().prepare("SELECT id,name,url,type,active,last_checked_at AS lastCheckedAt,created_at AS createdAt FROM news_sources ORDER BY active DESC,name").all() as NewsSource[]; }
export function addNewsSource(input: { name: string; url: string; type?: string }) { const result = getDb().prepare("INSERT INTO news_sources (name,url,type,active,last_checked_at,created_at) VALUES (?,?,?,1,NULL,?)").run(input.name.trim(), input.url.trim(), input.type || "website", Date.now()); return Number(result.lastInsertRowid); }
export function getArticleStats() { return getDb().prepare("SELECT COUNT(*) AS total,SUM(status='published') AS published,SUM(status='draft') AS draft,SUM(status='review') AS review,SUM(status='scheduled') AS scheduled FROM articles").get() as { total: number; published: number; draft: number; review: number; scheduled: number }; }

function mapCategory(row: Record<string, unknown>): CategoryRecord { return { id: Number(row.id), name: String(row.name), slug: String(row.slug), description: String(row.description), seoTitle: String(row.seo_title), seoDescription: String(row.seo_description), color: String(row.color), navOrder: Number(row.nav_order), isVisible: Number(row.is_visible), articleCount: Number(row.article_count ?? 0), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at) }; }
export function listCategories(visibleOnly = false) { const rows = getDb().prepare(`SELECT c.*,COUNT(a.id) AS article_count FROM categories c LEFT JOIN articles a ON a.category=c.name ${visibleOnly ? "WHERE c.is_visible=1" : ""} GROUP BY c.id ORDER BY c.nav_order,c.name`).all() as Record<string, unknown>[]; return rows.map(mapCategory); }
export function getCategoryBySlug(slug: string) { const row = getDb().prepare("SELECT c.*,COUNT(a.id) AS article_count FROM categories c LEFT JOIN articles a ON a.category=c.name WHERE c.slug=? AND c.is_visible=1 GROUP BY c.id").get(slug) as Record<string, unknown> | undefined; return row ? mapCategory(row) : null; }
export function saveCategory(input: CategoryInput, actor = "Yayın Yönetmeni") {
  const db = getDb(); const now = Date.now(); const values = { ...input, name: input.name.trim(), slug: slugify(input.slug || input.name), description: input.description?.trim() || "", seoTitle: input.seoTitle?.trim() || input.name.trim(), seoDescription: input.seoDescription?.trim() || input.description?.trim() || "", color: /^#[0-9a-f]{6}$/i.test(input.color || "") ? input.color : "#c92721", navOrder: Number.isFinite(Number(input.navOrder)) ? Number(input.navOrder) : 100, isVisible: input.isVisible === false || Number(input.isVisible) === 0 ? 0 : 1, now };
  const transaction = db.transaction(() => { let id = input.id; if (id) { const current = db.prepare("SELECT name FROM categories WHERE id=?").get(id) as { name: string } | undefined; if (!current) throw new Error("Kategori bulunamadı"); db.prepare("UPDATE categories SET name=@name,slug=@slug,description=@description,seo_title=@seoTitle,seo_description=@seoDescription,color=@color,nav_order=@navOrder,is_visible=@isVisible,updated_at=@now WHERE id=@id").run(values); if (current.name !== values.name) db.prepare("UPDATE articles SET category=?,updated_at=? WHERE category=?").run(values.name, now, current.name); } else id = Number(db.prepare("INSERT INTO categories (name,slug,description,seo_title,seo_description,color,nav_order,is_visible,created_at,updated_at) VALUES (@name,@slug,@description,@seoTitle,@seoDescription,@color,@navOrder,@isVisible,@now,@now)").run(values).lastInsertRowid); db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('category',?,?,?,?,?)").run(id, input.id ? "update" : "create", actor, JSON.stringify({ name: values.name, visible: values.isVisible }), now); return id!; });
  const id = transaction(); return mapCategory(db.prepare("SELECT c.*,COUNT(a.id) AS article_count FROM categories c LEFT JOIN articles a ON a.category=c.name WHERE c.id=? GROUP BY c.id").get(id) as Record<string, unknown>);
}

function mapMedia(row: Record<string, unknown>): MediaRecord { return { id: Number(row.id), storageKey: String(row.storage_key), publicUrl: String(row.public_url), originalName: String(row.original_name), mimeType: String(row.mime_type), sizeBytes: Number(row.size_bytes), altText: String(row.alt_text), credit: String(row.credit), createdAt: Number(row.created_at) }; }
export function saveMediaAsset(input: Omit<MediaRecord, "id" | "createdAt">, actor = "Yayın Yönetmeni") { const db = getDb(); const now = Date.now(); const result = db.prepare("INSERT INTO media_assets (storage_key,public_url,original_name,mime_type,size_bytes,alt_text,credit,created_at) VALUES (@storageKey,@publicUrl,@originalName,@mimeType,@sizeBytes,@altText,@credit,@now) ON CONFLICT(storage_key) DO UPDATE SET alt_text=excluded.alt_text,credit=excluded.credit RETURNING id").get({ ...input, now }) as { id: number }; db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('media',?,?,?,?,?)").run(result.id, "upload", actor, JSON.stringify({ name: input.originalName, size: input.sizeBytes }), now); return mapMedia(db.prepare("SELECT * FROM media_assets WHERE id=?").get(result.id) as Record<string, unknown>); }
export function listMediaAssets(limit = 80) { return (getDb().prepare("SELECT * FROM media_assets ORDER BY created_at DESC LIMIT ?").all(Math.min(Math.max(limit, 1), 200)) as Record<string, unknown>[]).map(mapMedia); }
export function getMediaStats() { const row = getDb().prepare("SELECT COUNT(*) AS total,COALESCE(SUM(size_bytes),0) AS totalBytes FROM media_assets").get() as { total: number; totalBytes: number }; return row; }

function mapAdminUser(row: Record<string, unknown>): AdminUser { return { id: Number(row.id), email: String(row.email), fullName: String(row.full_name), role: row.role as AdminRole, active: Number(row.active), mustChangePassword: Number(row.must_change_password), failedAttempts: Number(row.failed_attempts), lockedUntil: row.locked_until == null ? null : Number(row.locked_until), lastLoginAt: row.last_login_at == null ? null : Number(row.last_login_at), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at) }; }
export function listAdminUsers() { return (getDb().prepare("SELECT * FROM admin_users ORDER BY active DESC,full_name").all() as Record<string, unknown>[]).map(mapAdminUser); }
export function getAdminUserById(id: number) { const row = getDb().prepare("SELECT * FROM admin_users WHERE id=?").get(id) as Record<string, unknown> | undefined; return row ? mapAdminUser(row) : null; }
export function createAdminUser(input: { email: string; fullName: string; password: string; role: AdminRole; mustChangePassword?: boolean }, actor = "Sistem") { const now = Date.now(); const result = getDb().prepare("INSERT INTO admin_users (email,full_name,password_hash,role,active,must_change_password,failed_attempts,locked_until,last_login_at,created_at,updated_at) VALUES (?,?,?,?,1,?,0,NULL,NULL,?,?)").run(input.email.trim().toLowerCase(), input.fullName.trim(), hashPassword(input.password), input.role, input.mustChangePassword === false ? 0 : 1, now, now); const id = Number(result.lastInsertRowid); getDb().prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('admin_user',?,?,?,?,?)").run(id, "create", actor, JSON.stringify({ email: input.email, role: input.role }), now); return getAdminUserById(id)!; }
export function authenticateAdmin(email: string, password: string) { const db = getDb(); const now = Date.now(); const row = db.prepare("SELECT * FROM admin_users WHERE email=?").get(email.trim().toLowerCase()) as Record<string, unknown> | undefined; if (!row) return null; const user = mapAdminUser(row); if (!user.active || (user.lockedUntil && user.lockedUntil > now)) return null; if (!verifyPassword(password, String(row.password_hash))) { const attempts = user.failedAttempts + 1; db.prepare("UPDATE admin_users SET failed_attempts=?,locked_until=?,updated_at=? WHERE id=?").run(attempts >= 5 ? 0 : attempts, attempts >= 5 ? now + 15 * 60_000 : null, now, user.id); return null; } db.prepare("UPDATE admin_users SET failed_attempts=0,locked_until=NULL,last_login_at=?,updated_at=? WHERE id=?").run(now, now, user.id); return getAdminUserById(user.id); }
export function createAdminSession(userId: number, userAgent = "") { const token = randomBytes(32).toString("base64url"); const tokenHash = createHash("sha256").update(token).digest("hex"); const now = Date.now(); const expiresAt = now + 12 * 60 * 60_000; const db = getDb(); db.prepare("DELETE FROM admin_sessions WHERE expires_at<=?").run(now); db.prepare("INSERT INTO admin_sessions (token_hash,user_id,expires_at,created_at,last_seen_at,user_agent) VALUES (?,?,?,?,?,?)").run(tokenHash, userId, expiresAt, now, now, userAgent.slice(0, 300)); return { token, expiresAt }; }
export function getAdminSession(token: string) { if (!token) return null; const tokenHash = createHash("sha256").update(token).digest("hex"); const now = Date.now(); const row = getDb().prepare("SELECT u.* FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.active=1").get(tokenHash, now) as Record<string, unknown> | undefined; if (!row) return null; getDb().prepare("UPDATE admin_sessions SET last_seen_at=? WHERE token_hash=? AND last_seen_at<?").run(now, tokenHash, now - 5 * 60_000); return { user: mapAdminUser(row), tokenHash }; }
export function deleteAdminSession(token: string) { if (!token) return; getDb().prepare("DELETE FROM admin_sessions WHERE token_hash=?").run(createHash("sha256").update(token).digest("hex")); }
export function changeAdminPassword(userId: number, currentPassword: string, nextPassword: string) { const db = getDb(); const row = db.prepare("SELECT password_hash FROM admin_users WHERE id=? AND active=1").get(userId) as { password_hash: string } | undefined; if (!row || !verifyPassword(currentPassword, row.password_hash)) throw new Error("Mevcut parola doğru değil."); const now = Date.now(); db.transaction(() => { db.prepare("UPDATE admin_users SET password_hash=?,must_change_password=0,failed_attempts=0,locked_until=NULL,updated_at=? WHERE id=?").run(hashPassword(nextPassword), now, userId); db.prepare("DELETE FROM admin_sessions WHERE user_id=?").run(userId); db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('admin_user',?,'password_change','Kullanıcı','',?)").run(userId, now); })(); }

/* Ziyaretçi sitesi keşif sorguları: arama, son dakika akışı, video merkezi ve yazar sayfaları. */
export type AuthorRecord = { name: string; slug: string; articleCount: number; lastPublishedAt: number | null; topCategory: string; latestTitle: string; latestSlug: string };

export function searchArticles(query: string, limit = 40) {
  publishDueArticles();
  const term = query.trim().slice(0, 120);
  if (term.length < 2) return [];
  const pattern = `%${term.replace(/[%_]/g, (character) => `\\${character}`)}%`;
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const rows = getDb().prepare("SELECT * FROM articles WHERE status='published' AND (title LIKE ? ESCAPE '\\' OR spot LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\' OR category LIKE ? ESCAPE '\\' OR author LIKE ? ESCAPE '\\') ORDER BY CASE WHEN title LIKE ? ESCAPE '\\' THEN 0 ELSE 1 END, published_at DESC LIMIT ?").all(pattern, pattern, pattern, pattern, pattern, pattern, safeLimit) as Record<string, unknown>[];
  return rows.map(mapArticle);
}

export function listBreakingArticles(limit = 40) {
  publishDueArticles();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return (getDb().prepare("SELECT * FROM articles WHERE status='published' ORDER BY is_breaking DESC, published_at DESC LIMIT ?").all(safeLimit) as Record<string, unknown>[]).map(mapArticle);
}

export function listVideoArticles(limit = 30) {
  publishDueArticles();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return (getDb().prepare("SELECT * FROM articles WHERE status='published' AND TRIM(video_url)<>'' ORDER BY published_at DESC LIMIT ?").all(safeLimit) as Record<string, unknown>[]).map(mapArticle);
}

export function listAuthors(): AuthorRecord[] {
  publishDueArticles();
  const rows = getDb().prepare("SELECT author, COUNT(*) AS article_count, MAX(published_at) AS last_published_at FROM articles WHERE status='published' AND TRIM(author)<>'' GROUP BY author ORDER BY article_count DESC, author").all() as Record<string, unknown>[];
  return rows.map((row) => {
    const name = String(row.author);
    const latest = getDb().prepare("SELECT title, slug, category FROM articles WHERE status='published' AND author=? ORDER BY published_at DESC LIMIT 1").get(name) as { title: string; slug: string; category: string } | undefined;
    return { name, slug: slugify(name), articleCount: Number(row.article_count), lastPublishedAt: row.last_published_at == null ? null : Number(row.last_published_at), topCategory: latest?.category ?? "", latestTitle: latest?.title ?? "", latestSlug: latest?.slug ?? "" };
  });
}

export function getAuthorBySlug(slug: string) { return listAuthors().find((author) => author.slug === slug) ?? null; }

export function listArticlesByAuthor(author: string, limit = 40) {
  publishDueArticles();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return (getDb().prepare("SELECT * FROM articles WHERE status='published' AND author=? ORDER BY published_at DESC LIMIT ?").all(author, safeLimit) as Record<string, unknown>[]).map(mapArticle);
}

/* Kullanıcı yetki değişikliği ve pasife alma. Son aktif yöneticinin kilitlenmesi engellenir. */
export function updateAdminUser(id: number, changes: { role?: AdminRole; active?: boolean }, actor: AdminUser) {
  const db = getDb();
  const target = getAdminUserById(id);
  if (!target) throw new Error("Kullanıcı bulunamadı.");
  if (target.id === actor.id && (changes.role && changes.role !== target.role || changes.active === false)) throw new Error("Kendi rolünüzü değiştiremez veya hesabınızı kapatamazsınız.");
  const nextRole = changes.role ?? target.role;
  const nextActive = changes.active === undefined ? Boolean(target.active) : changes.active;
  const activeAdmins = (db.prepare("SELECT COUNT(*) AS total FROM admin_users WHERE role='admin' AND active=1").get() as { total: number }).total;
  const losesAdmin = target.role === "admin" && Number(target.active) === 1 && (nextRole !== "admin" || !nextActive);
  if (losesAdmin && activeAdmins <= 1) throw new Error("Sistemde en az bir aktif yönetici kalmalıdır.");
  const now = Date.now();
  db.transaction(() => {
    db.prepare("UPDATE admin_users SET role=?,active=?,updated_at=? WHERE id=?").run(nextRole, nextActive ? 1 : 0, now, id);
    if (!nextActive) db.prepare("DELETE FROM admin_sessions WHERE user_id=?").run(id);
    db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('admin_user',?,'update',?,?,?)").run(id, actor.fullName, JSON.stringify({ fromRole: target.role, toRole: nextRole, fromActive: Number(target.active), toActive: nextActive ? 1 : 0 }), now);
  })();
  return getAdminUserById(id)!;
}

/* Site ayarları: yönetim panelinden düzenlenir, ziyaretçi sitesi ve kurumsal sayfalar buradan okur. */
export type SiteSettings = Record<string, string> & { broadcastSchedule: string };
export type ScheduleRow = { time: string; title: string; host: string };

export function getSiteSettings(): SiteSettings {
  const stored = getDb().prepare("SELECT key, value FROM site_settings").all() as { key: string; value: string }[];
  const values = defaultSettings() as SiteSettings;
  for (const row of stored) if (row.key in values) values[row.key] = row.value;
  return values;
}

export function getBroadcastSchedule(): ScheduleRow[] {
  try {
    const parsed = JSON.parse(getSiteSettings().broadcastSchedule);
    const rows = normalizeSchedule(parsed);
    return rows.length ? rows : scheduleDefault;
  } catch {
    return scheduleDefault;
  }
}

export function saveSiteSettings(values: Record<string, string>, actor = "Sistem") {
  const db = getDb();
  const now = Date.now();
  const entries = Object.entries(values);
  if (!entries.length) return getSiteSettings();
  db.transaction(() => {
    const statement = db.prepare("INSERT INTO site_settings (key,value,updated_at,updated_by) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at, updated_by=excluded.updated_by");
    for (const [key, value] of entries) statement.run(key, value, now, actor);
    db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('site_settings',0,'update',?,?,?)").run(actor, JSON.stringify({ keys: entries.map(([key]) => key) }), now);
  })();
  return getSiteSettings();
}

/* Eski adres yönlendirmeleri: taşınan URL değerinin kaybedilmemesi için. */
export type RedirectRecord = { id: number; fromPath: string; toPath: string; kind: "permanent" | "temporary"; note: string; active: number; hits: number; lastHitAt: number | null; lastCheckStatus: number | null; lastCheckedAt: number | null; createdAt: number; updatedAt: number };

function mapRedirect(row: Record<string, unknown>): RedirectRecord {
  return { id: Number(row.id), fromPath: String(row.from_path), toPath: String(row.to_path), kind: row.kind as "permanent" | "temporary", note: String(row.note), active: Number(row.active), hits: Number(row.hits), lastHitAt: row.last_hit_at == null ? null : Number(row.last_hit_at), lastCheckStatus: row.last_check_status == null ? null : Number(row.last_check_status), lastCheckedAt: row.last_checked_at == null ? null : Number(row.last_checked_at), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at) };
}

export function listRedirects(limit = 200) {
  return (getDb().prepare("SELECT * FROM redirects ORDER BY active DESC, hits DESC, from_path LIMIT ?").all(Math.min(Math.max(limit, 1), 500)) as Record<string, unknown>[]).map(mapRedirect);
}

export function saveRedirect(input: { id?: number; fromPath: string; toPath: string; kind: "permanent" | "temporary"; note?: string; active?: number | boolean }, actor = "Sistem") {
  const db = getDb();
  const now = Date.now();
  const active = input.active === undefined ? 1 : input.active ? 1 : 0;
  const row = { fromPath: input.fromPath, toPath: input.toPath, kind: input.kind, note: input.note ?? "", active, now };
  let id: number;
  if (input.id) {
    db.prepare("UPDATE redirects SET from_path=@fromPath,to_path=@toPath,kind=@kind,note=@note,active=@active,updated_at=@now WHERE id=@id").run({ ...row, id: input.id });
    id = input.id;
  } else {
    const inserted = db.prepare("INSERT INTO redirects (from_path,to_path,kind,note,active,hits,created_at,updated_at) VALUES (@fromPath,@toPath,@kind,@note,@active,0,@now,@now) ON CONFLICT(from_path) DO UPDATE SET to_path=excluded.to_path,kind=excluded.kind,note=excluded.note,active=excluded.active,updated_at=excluded.updated_at RETURNING id").get(row) as { id: number };
    id = Number(inserted.id);
  }
  db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('redirect',?,?,?,?,?)").run(id, input.id ? "update" : "create", actor, JSON.stringify({ from: input.fromPath, to: input.toPath, kind: input.kind }), now);
  return mapRedirect(db.prepare("SELECT * FROM redirects WHERE id=?").get(id) as Record<string, unknown>);
}

export function saveRedirectBatch(rows: { fromPath: string; toPath: string; kind: "permanent" | "temporary"; note?: string }[], actor = "Sistem") {
  let created = 0;
  for (const row of rows) { saveRedirect(row, actor); created += 1; }
  return created;
}

export function deleteRedirect(id: number, actor = "Sistem") {
  const db = getDb();
  const existing = db.prepare("SELECT from_path FROM redirects WHERE id=?").get(id) as { from_path: string } | undefined;
  if (!existing) return false;
  db.prepare("DELETE FROM redirects WHERE id=?").run(id);
  db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('redirect',?,'delete',?,?,?)").run(id, actor, JSON.stringify({ from: existing.from_path }), Date.now());
  return true;
}

export function findRedirect(path: string) {
  const normalized = normalizePath(path);
  if (!normalized) return null;
  const row = getDb().prepare("SELECT * FROM redirects WHERE from_path=? AND active=1").get(normalized) as Record<string, unknown> | undefined;
  return row ? mapRedirect(row) : null;
}

export function recordRedirectHit(id: number) {
  getDb().prepare("UPDATE redirects SET hits=hits+1, last_hit_at=? WHERE id=?").run(Date.now(), id);
}

export function recordRedirectCheck(id: number, status: number) {
  getDb().prepare("UPDATE redirects SET last_check_status=?, last_checked_at=? WHERE id=?").run(status, Date.now(), id);
}
