import { mkdirSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { dirname, resolve } from "node:path";
import Database from "better-sqlite3";
import { slugify } from "./article-model.mjs";
import { hashPassword, verifyPassword } from "./auth-model.mjs";
import { DEMO_ARTICLE_SLUGS, shouldSeedDemoContent } from "./demo-content-model.mjs";
import { defaultSettings, normalizePath, normalizeSchedule, officialSocialAccounts, scheduleDefault } from "./settings-model.mjs";
import { legacyPath } from "./import-model.mjs";
import { agencyUpdateDecision } from "./agency-model.mjs";
import { advertisementState, houseAdSeeds } from "./ad-model.mjs";
import { seedArticles, seedCategories, seedSources } from "./seed";

export type ContentRow = { key: string; value: string };
export type ArticleStatus = "draft" | "review" | "scheduled" | "published";
export type WorkflowState = "reporter_draft" | "editor_review" | "changes_requested" | "approved" | "rejected" | "published" | "withdrawn";
export type ContentBlock = { id: string; type: "paragraph" | "heading" | "quote" | "list" | "image" | "video" | "embed"; content: string; caption?: string };
export type ArticleRecord = { id: number; slug: string; title: string; spot: string; body: string; blocks: ContentBlock[]; category: string; status: ArticleStatus; workflowState: WorkflowState; assignedTo: number | null; editVersion: number; correctionNote: string; withdrawnAt: number | null; heroImage: string; imageAlt: string; videoUrl: string; author: string; sourceName: string; sourceUrl: string; seoTitle: string; seoDescription: string; isBreaking: number; isFeatured: number; homepageOrder: number; publishedAt: number | null; scheduledAt: number | null; agencySourceId: number | null; agencyExternalId: string; agencyCredit: string; agencyReceivedAt: number | null; agencyDisclaimer: string; agencyEditorialLock: number; agencyUpdatePending: number; createdAt: number; updatedAt: number };
export type ArticleInput = Omit<ArticleRecord, "id" | "createdAt" | "updatedAt" | "publishedAt" | "scheduledAt"> & { id?: number; publishedAt?: number | string | null; scheduledAt?: number | string | null };
export type NewsSource = { id: number; name: string; url: string; type: string; provider: string; feedFormat: string; authType: string; secretEnv: string; credentialReady: boolean; pollIntervalMinutes: number; publishMode: string; defaultCategory: string; categoryMap: string; disclaimer: string; active: number; lastCheckedAt: number | null; lastSuccessAt: number | null; lastError: string; nextPollAt: number | null; itemCount: number; createdAt: number; updatedAt: number };
export type CategoryRecord = { id: number; name: string; slug: string; description: string; seoTitle: string; seoDescription: string; color: string; navOrder: number; isVisible: number; articleCount: number; createdAt: number; updatedAt: number };
export type CategoryInput = { id?: number; name: string; slug?: string; description?: string; seoTitle?: string; seoDescription?: string; color?: string; navOrder?: number; isVisible?: number | boolean };
export type MediaRecord = { id: number; storageKey: string; publicUrl: string; originalName: string; mimeType: string; sizeBytes: number; altText: string; credit: string; createdAt: number };
export type AdminRole = "admin" | "publisher" | "editor" | "reporter" | "viewer";
export type AdminUser = { id: number; email: string; fullName: string; role: AdminRole; active: number; mustChangePassword: number; failedAttempts: number; lockedUntil: number | null; lastLoginAt: number | null; createdAt: number; updatedAt: number };
export type AdvertisementRecord = { id: number; placement: string; advertiser: string; campaignName: string; title: string; description: string; imageUrl: string; targetUrl: string; ctaLabel: string; theme: string; kind: string; priority: number; active: number; startsAt: number | null; endsAt: number | null; state: "live" | "scheduled" | "paused" | "expired"; createdAt: number; updatedAt: number };

let database: InstanceType<typeof Database> | undefined;
function databasePath() { return resolve(process.env.KOZA_DB_PATH ?? resolve(process.cwd(), "data/koza.sqlite")); }
function parseBlocks(value: unknown, body: string): ContentBlock[] { try { const blocks = JSON.parse(String(value || "[]")); if (Array.isArray(blocks) && blocks.length) return blocks; } catch { /* Eski veya bozuk blok JSON'u düz metin olarak korunur. */ } return [{ id: "legacy", type: "paragraph", content: body }]; }
function mapArticle(row: Record<string, unknown>): ArticleRecord { const body = String(row.body); return { id: Number(row.id), slug: String(row.slug), title: String(row.title), spot: String(row.spot), body, blocks: parseBlocks(row.content_blocks, body), category: String(row.category), status: row.status as ArticleStatus, workflowState: (row.workflow_state || (row.status === "published" ? "published" : "reporter_draft")) as WorkflowState, assignedTo: row.assigned_to == null ? null : Number(row.assigned_to), editVersion: Number(row.edit_version || 1), correctionNote: String(row.correction_note || ""), withdrawnAt: row.withdrawn_at == null ? null : Number(row.withdrawn_at), heroImage: String(row.hero_image), imageAlt: String(row.image_alt), videoUrl: String(row.video_url), author: String(row.author), sourceName: String(row.source_name), sourceUrl: String(row.source_url), seoTitle: String(row.seo_title), seoDescription: String(row.seo_description), isBreaking: Number(row.is_breaking), isFeatured: Number(row.is_featured), homepageOrder: Number(row.homepage_order ?? 100), publishedAt: row.published_at == null ? null : Number(row.published_at), scheduledAt: row.scheduled_at == null ? null : Number(row.scheduled_at), agencySourceId: row.agency_source_id == null ? null : Number(row.agency_source_id), agencyExternalId: String(row.agency_external_id || ""), agencyCredit: String(row.agency_credit || ""), agencyReceivedAt: row.agency_received_at == null ? null : Number(row.agency_received_at), agencyDisclaimer: String(row.agency_disclaimer || ""), agencyEditorialLock: Number(row.agency_editorial_lock || 0), agencyUpdatePending: Number(row.agency_update_pending || 0), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at) }; }
function mapAdvertisement(row: Record<string, unknown>): AdvertisementRecord { const record = { id: Number(row.id), placement: String(row.placement), advertiser: String(row.advertiser), campaignName: String(row.campaign_name || ""), title: String(row.title), description: String(row.description || ""), imageUrl: String(row.image_url || ""), targetUrl: String(row.target_url || ""), ctaLabel: String(row.cta_label || ""), theme: String(row.theme || "dark"), kind: String(row.kind || "direct"), priority: Number(row.priority || 100), active: Number(row.active), startsAt: row.starts_at == null ? null : Number(row.starts_at), endsAt: row.ends_at == null ? null : Number(row.ends_at), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at) }; return { ...record, state: advertisementState(record) }; }

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
    CREATE TABLE IF NOT EXISTS import_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, source_url TEXT NOT NULL UNIQUE, source_path TEXT NOT NULL, source_lastmod INTEGER,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','imported','skipped','failed')),
      article_id INTEGER, title TEXT NOT NULL DEFAULT '', message TEXT NOT NULL DEFAULT '',
      discovered_at INTEGER NOT NULL, processed_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_import_items_status ON import_items(status, source_lastmod DESC);
    CREATE TABLE IF NOT EXISTS agency_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, source_id INTEGER NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL, article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'published', payload_hash TEXT NOT NULL, pending_hash TEXT NOT NULL DEFAULT '', raw_payload TEXT NOT NULL DEFAULT '',
      source_published_at INTEGER, source_updated_at INTEGER, received_at INTEGER NOT NULL, processed_at INTEGER NOT NULL,
      UNIQUE(source_id, external_id)
    );
    CREATE INDEX IF NOT EXISTS idx_agency_items_source_received ON agency_items(source_id, received_at DESC);
    CREATE TABLE IF NOT EXISTS advertisements (
      id INTEGER PRIMARY KEY AUTOINCREMENT, placement TEXT NOT NULL CHECK (placement IN ('site_top','home_billboard','section_inline','article_sidebar')), advertiser TEXT NOT NULL, campaign_name TEXT NOT NULL DEFAULT '',
      title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', image_url TEXT NOT NULL DEFAULT '', target_url TEXT NOT NULL DEFAULT '', cta_label TEXT NOT NULL DEFAULT '',
      theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('red','dark','light')), kind TEXT NOT NULL DEFAULT 'direct' CHECK (kind IN ('house','direct','programmatic')),
      priority INTEGER NOT NULL DEFAULT 100 CHECK (typeof(priority)='integer' AND priority BETWEEN 1 AND 999), active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)), starts_at INTEGER, ends_at INTEGER,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at)
    );
    CREATE INDEX IF NOT EXISTS idx_advertisements_delivery ON advertisements(placement,active,priority DESC,starts_at,ends_at);
    CREATE TRIGGER IF NOT EXISTS trg_advertisements_validate_insert BEFORE INSERT ON advertisements
    WHEN NEW.placement NOT IN ('site_top','home_billboard','section_inline','article_sidebar') OR typeof(NEW.priority)<>'integer' OR NEW.priority NOT BETWEEN 1 AND 999 OR NEW.active NOT IN (0,1) OR (NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL AND NEW.starts_at>=NEW.ends_at)
    BEGIN SELECT RAISE(ABORT,'Geçersiz reklam kaydı'); END;
    CREATE TRIGGER IF NOT EXISTS trg_advertisements_validate_update BEFORE UPDATE ON advertisements
    WHEN NEW.placement NOT IN ('site_top','home_billboard','section_inline','article_sidebar') OR typeof(NEW.priority)<>'integer' OR NEW.priority NOT BETWEEN 1 AND 999 OR NEW.active NOT IN (0,1) OR (NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL AND NEW.starts_at>=NEW.ends_at)
    BEGIN SELECT RAISE(ABORT,'Geçersiz reklam kaydı'); END;
  `);
  ensureColumn(db, "articles", "content_blocks", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "articles", "workflow_state", "TEXT NOT NULL DEFAULT 'reporter_draft'");
  ensureColumn(db, "articles", "assigned_to", "INTEGER");
  ensureColumn(db, "articles", "edit_version", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(db, "articles", "correction_note", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "articles", "withdrawn_at", "INTEGER");
  ensureColumn(db, "articles", "homepage_order", "INTEGER NOT NULL DEFAULT 100");
  ensureColumn(db, "articles", "agency_source_id", "INTEGER REFERENCES news_sources(id)");
  ensureColumn(db, "articles", "agency_external_id", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "articles", "agency_credit", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "articles", "agency_received_at", "INTEGER");
  ensureColumn(db, "articles", "agency_editorial_lock", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "agency_items", "pending_hash", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "news_sources", "provider", "TEXT NOT NULL DEFAULT 'other'");
  ensureColumn(db, "news_sources", "feed_format", "TEXT NOT NULL DEFAULT 'rss'");
  ensureColumn(db, "news_sources", "auth_type", "TEXT NOT NULL DEFAULT 'none'");
  ensureColumn(db, "news_sources", "secret_env", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "news_sources", "poll_interval_minutes", "INTEGER NOT NULL DEFAULT 15");
  ensureColumn(db, "news_sources", "publish_mode", "TEXT NOT NULL DEFAULT 'review'");
  ensureColumn(db, "news_sources", "default_category", "TEXT NOT NULL DEFAULT 'Gündem'");
  ensureColumn(db, "news_sources", "category_map", "TEXT NOT NULL DEFAULT '{}'");
  ensureColumn(db, "news_sources", "disclaimer", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "news_sources", "last_success_at", "INTEGER");
  ensureColumn(db, "news_sources", "last_error", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "news_sources", "next_poll_at", "INTEGER");
  ensureColumn(db, "news_sources", "updated_at", "INTEGER NOT NULL DEFAULT 0");
  db.exec("CREATE INDEX IF NOT EXISTS idx_workflow_state_assignee ON articles(workflow_state,assigned_to,updated_at DESC)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_agency_identity ON articles(agency_source_id,agency_external_id) WHERE agency_source_id IS NOT NULL AND agency_external_id<>''");

  /* İlk kurulumda patronların reklam alanlarını gerçek sayfa bağlamında görebilmesi için
     Koza TV kurum içi tanıtımları eklenir. Sonraki yönetici tercihleri asla ezilmez. */
  const now = Date.now();
  const insertHouseAdvertisement = db.prepare(`INSERT INTO advertisements (placement,advertiser,campaign_name,title,description,image_url,target_url,cta_label,theme,kind,priority,active,starts_at,ends_at,created_at,updated_at)
    SELECT @placement,@advertiser,@campaignName,@title,@description,@imageUrl,@targetUrl,@ctaLabel,@theme,@kind,@priority,1,NULL,NULL,@now,@now
    WHERE NOT EXISTS (SELECT 1 FROM advertisements WHERE placement=@placement)`);
  db.transaction(() => { for (const advertisement of houseAdSeeds) insertHouseAdvertisement.run({ ...advertisement, now }); })();

  /* Resmî sosyal hesaplar ilk kez tanımlandığında yalnız boş ayarlar doldurulur.
     Bir defalık işaret, yöneticinin daha sonra panelden hesabı kaldırma kararını korur. */
  const socialSeedKey = "_official_social_accounts_v1";
  const socialSeeded = db.prepare("SELECT 1 FROM site_settings WHERE key=?").get(socialSeedKey);
  if (!socialSeeded) {
    const now = Date.now();
    const upsert = db.prepare(`INSERT INTO site_settings (key,value,updated_at,updated_by) VALUES (?,?,?,'Koza TV resmî hesapları')
      ON CONFLICT(key) DO UPDATE SET value=CASE WHEN TRIM(site_settings.value)='' THEN excluded.value ELSE site_settings.value END,
      updated_at=CASE WHEN TRIM(site_settings.value)='' THEN excluded.updated_at ELSE site_settings.updated_at END`);
    db.transaction(() => {
      for (const [key, value] of Object.entries(officialSocialAccounts)) upsert.run(key, value, now);
      db.prepare("INSERT INTO site_settings (key,value,updated_at,updated_by) VALUES (?,?,?,'Sistem')").run(socialSeedKey, "1", now);
    })();
  }

  /* Aktarımın ilk sürümü kapak görseli bulunamayan haberlere gerçek bir haber karesini
     (`/news/gundem.jpg`) yedek olarak yazıyordu; bu, okura yanlış görsel gösteriyordu.
     Yalnızca aktarılan kayıtlar tarafsız yer tutucuya çevrilir. */
  db.prepare("UPDATE articles SET hero_image='/news/gorsel-yok.svg' WHERE source_name='kozatv.com.tr' AND hero_image='/news/gundem.jpg'").run();

  /* Prototip haberleri canlı içerik değildir. Üretimde yalnız bilinen slug + boş kaynak
     birleşimi silinir; editörün gerçek haberlerine ve aktarılan arşive dokunulmaz. */
  const demoEnabled = shouldSeedDemoContent(process.env.KOZA_ENABLE_DEMO_CONTENT);
  if (!demoEnabled && DEMO_ARTICLE_SLUGS.length) {
    const placeholders = DEMO_ARTICLE_SLUGS.map(() => "?").join(",");
    db.prepare(`DELETE FROM articles WHERE source_url='' AND source_name='Koza TV' AND slug IN (${placeholders})`)
      .run(...DEMO_ARTICLE_SLUGS);
  }

  const articleCount = Number((db.prepare("SELECT COUNT(*) AS count FROM articles").get() as { count: number }).count);
  if (articleCount === 0 && demoEnabled) {
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

export function listArticles(options: { status?: ArticleStatus; category?: string; assignedTo?: number; limit?: number } = {}) { const where: string[] = []; const params: unknown[] = []; if (options.status) { where.push("a.status = ?"); params.push(options.status); } if (options.category) { where.push("a.category = ?"); params.push(options.category); } if (options.assignedTo) { where.push("a.assigned_to = ?"); params.push(options.assignedTo); } const limit = Math.min(Math.max(options.limit ?? 50, 1), 100); const rows = getDb().prepare(`SELECT a.*,EXISTS(SELECT 1 FROM agency_items ai WHERE ai.article_id=a.id AND ai.status='pending_update') AS agency_update_pending FROM articles a ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY COALESCE(a.published_at,a.scheduled_at,a.updated_at) DESC LIMIT ?`).all(...params, limit) as Record<string, unknown>[]; return rows.map(mapArticle); }
export function getAdminArticle(id: number) { const row = getDb().prepare("SELECT a.*,EXISTS(SELECT 1 FROM agency_items ai WHERE ai.article_id=a.id AND ai.status='pending_update') AS agency_update_pending FROM articles a WHERE a.id=?").get(id) as Record<string, unknown> | undefined; return row ? mapArticle(row) : null; }
function publishDueArticles() { const now = Date.now(); getDb().prepare("UPDATE articles SET status='published',workflow_state='published',published_at=COALESCE(published_at,scheduled_at,?),edit_version=edit_version+1,updated_at=? WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at<=?").run(now, now, now); }
export function listPublishedArticles(limit = 30) { publishDueArticles(); const safeLimit = Math.min(Math.max(limit, 1), 100); return (getDb().prepare("SELECT * FROM articles WHERE status='published' ORDER BY is_featured DESC,homepage_order ASC,published_at DESC LIMIT ?").all(safeLimit) as Record<string, unknown>[]).map(mapArticle); }
export function getArticleBySlug(slug: string) { publishDueArticles(); const row = getDb().prepare("SELECT a.*,s.disclaimer AS agency_disclaimer,EXISTS(SELECT 1 FROM agency_items ai WHERE ai.article_id=a.id AND ai.status='pending_update') AS agency_update_pending FROM articles a LEFT JOIN news_sources s ON s.id=a.agency_source_id WHERE a.slug=? AND a.status='published'").get(slug) as Record<string, unknown> | undefined; return row ? mapArticle(row) : null; }

export function saveArticle(input: ArticleInput, actor: AdminUser | string = "Yayın Yönetmeni") {
  const db = getDb(); const now = Date.now(); const actorName = typeof actor === "string" ? actor : actor.fullName; const actorId = typeof actor === "string" ? null : actor.id; const slug = input.slug || slugify(input.title); const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt).getTime() : null; const publishedAt = input.status === "published" ? (input.publishedAt ? new Date(input.publishedAt).getTime() : now) : null;
  const blocks = Array.isArray(input.blocks) && input.blocks.length ? input.blocks : [{ id: randomBytes(6).toString("hex"), type: "paragraph" as const, content: input.body }];
  const agencySourceId = Number.isInteger(Number(input.agencySourceId)) && Number(input.agencySourceId) > 0 ? Number(input.agencySourceId) : null;
  if (agencySourceId && !getNewsSource(agencySourceId)) throw new Error("AGENCY_SOURCE_NOT_FOUND");
  const values = { ...input, slug, scheduledAt, publishedAt, contentBlocks: JSON.stringify(blocks), heroImage: input.heroImage || "/news/gundem.jpg", imageAlt: input.imageAlt || input.title, videoUrl: input.videoUrl || "", author: input.author || "Koza TV Haber Merkezi", sourceName: input.sourceName == null ? "Koza TV" : String(input.sourceName).trim().slice(0, 160), sourceUrl: input.sourceUrl || "", seoTitle: input.seoTitle || input.title, seoDescription: input.seoDescription || input.spot, isBreaking: input.isBreaking ? 1 : 0, isFeatured: input.isFeatured ? 1 : 0, homepageOrder: Math.min(Math.max(Number(input.homepageOrder ?? 100), 1), 999), assignedTo: Number.isInteger(Number(input.assignedTo)) && Number(input.assignedTo) > 0 ? Number(input.assignedTo) : null, agencySourceId, agencyExternalId: String(input.agencyExternalId || "").trim().slice(0, 300), agencyCredit: String(input.agencyCredit || "").trim().slice(0, 300), agencyEditorialLock: input.agencyEditorialLock ? 1 : 0, now };
  if (input.status === "published" || input.status === "scheduled") { const workflow = input.id ? db.prepare("SELECT workflow_state AS workflowState FROM articles WHERE id=?").get(input.id) as { workflowState: WorkflowState } | undefined : undefined; if (!workflow || !["approved", "published"].includes(workflow.workflowState)) throw new Error("WORKFLOW_APPROVAL_REQUIRED"); }
  const transaction = db.transaction(() => { let id = input.id; if (id) { const expectedVersion = Number(input.editVersion || 1); const result = db.prepare(`UPDATE articles SET slug=@slug,title=@title,spot=@spot,body=@body,content_blocks=@contentBlocks,category=@category,status=@status,assigned_to=@assignedTo,hero_image=@heroImage,image_alt=@imageAlt,video_url=@videoUrl,author=@author,source_name=@sourceName,source_url=@sourceUrl,seo_title=@seoTitle,seo_description=@seoDescription,is_breaking=@isBreaking,is_featured=@isFeatured,homepage_order=@homepageOrder,published_at=@publishedAt,scheduled_at=@scheduledAt,agency_source_id=@agencySourceId,agency_external_id=@agencyExternalId,agency_credit=@agencyCredit,agency_received_at=CASE WHEN @agencySourceId IS NULL THEN NULL WHEN agency_source_id=@agencySourceId THEN agency_received_at ELSE @now END,agency_editorial_lock=@agencyEditorialLock,edit_version=edit_version+1,updated_at=@now WHERE id=@id AND edit_version=@expectedVersion`).run({ ...values, expectedVersion }); if (!result.changes) throw new Error("EDIT_CONFLICT"); } else { const result = db.prepare(`INSERT INTO articles (slug,title,spot,body,content_blocks,category,status,workflow_state,assigned_to,hero_image,image_alt,video_url,author,source_name,source_url,seo_title,seo_description,is_breaking,is_featured,homepage_order,published_at,scheduled_at,agency_source_id,agency_external_id,agency_credit,agency_received_at,agency_editorial_lock,created_at,updated_at) VALUES (@slug,@title,@spot,@body,@contentBlocks,@category,@status,'reporter_draft',@assignedTo,@heroImage,@imageAlt,@videoUrl,@author,@sourceName,@sourceUrl,@seoTitle,@seoDescription,@isBreaking,@isFeatured,@homepageOrder,@publishedAt,@scheduledAt,@agencySourceId,@agencyExternalId,@agencyCredit,CASE WHEN @agencySourceId IS NULL THEN NULL ELSE @now END,@agencyEditorialLock,@now,@now)`).run(values); id = Number(result.lastInsertRowid); } const article = mapArticle(db.prepare("SELECT * FROM articles WHERE id=?").get(id) as Record<string, unknown>); db.prepare("INSERT INTO article_revisions (article_id,version,snapshot,actor_id,actor_name,reason,created_at) VALUES (?,?,?,?,?,'save',?)").run(id, article.editVersion, JSON.stringify(article), actorId, actorName, now); db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,?,?,?,?)").run(id, input.status === "published" ? "publish" : "save", actorName, JSON.stringify({ status: input.status, title: input.title, version: article.editVersion, agencySourceId, agencyExternalId: values.agencyExternalId }), now); db.prepare("UPDATE agency_items SET status='editorial_override',pending_hash='' WHERE article_id=? AND status='pending_update'").run(id); return id!; });
  const id = transaction(); return getAdminArticle(id)!;
}

export function listArticleRevisions(articleId: number) { return getDb().prepare("SELECT id,article_id AS articleId,version,actor_name AS actorName,reason,created_at AS createdAt FROM article_revisions WHERE article_id=? ORDER BY version DESC LIMIT 50").all(articleId); }
export function restoreArticleRevision(articleId: number, revisionId: number, actor: AdminUser) { const db = getDb(); const row = db.prepare("SELECT snapshot FROM article_revisions WHERE id=? AND article_id=?").get(revisionId, articleId) as { snapshot: string } | undefined; if (!row) throw new Error("REVISION_NOT_FOUND"); const snapshot = JSON.parse(row.snapshot) as ArticleRecord; const current = mapArticle(db.prepare("SELECT * FROM articles WHERE id=?").get(articleId) as Record<string, unknown>); return saveArticle({ ...snapshot, id: articleId, editVersion: current.editVersion }, actor); }
export function listArticleComments(articleId: number) { return getDb().prepare("SELECT id,article_id AS articleId,user_id AS userId,author_name AS authorName,body,resolved,created_at AS createdAt FROM article_comments WHERE article_id=? ORDER BY created_at DESC").all(articleId); }
export function addArticleComment(articleId: number, body: string, actor: AdminUser) { const value = body.trim().slice(0, 2000); if (value.length < 2) throw new Error("COMMENT_REQUIRED"); const result = getDb().prepare("INSERT INTO article_comments (article_id,user_id,author_name,body,resolved,created_at) VALUES (?,?,?,?,0,?)").run(articleId, actor.id, actor.fullName, value, Date.now()); return Number(result.lastInsertRowid); }
export function listWorkflowEvents(articleId: number) { return getDb().prepare("SELECT id,action,from_state AS fromState,to_state AS toState,actor_name AS actorName,note,created_at AS createdAt FROM workflow_events WHERE article_id=? ORDER BY created_at DESC LIMIT 100").all(articleId); }
export function getEditorialReport() { const since = Date.now() - 30 * 86_400_000; return getDb().prepare("SELECT actor_name AS actorName,COUNT(*) AS total,SUM(action='publish') AS published,SUM(action='approve') AS approved,SUM(action='request_changes') AS changesRequested,SUM(action='reject') AS rejected FROM workflow_events WHERE created_at>=? GROUP BY actor_id,actor_name ORDER BY total DESC LIMIT 20").all(since); }

function publicationChecklist(article: ArticleRecord) { const missing: string[] = []; if (article.title.trim().length < 12) missing.push("başlık"); if (article.spot.trim().length < 24) missing.push("spot"); if (article.body.trim().length < 80) missing.push("haber metni"); if (!article.heroImage.trim()) missing.push("kapak görseli"); if (!article.imageAlt.trim()) missing.push("görsel alt metni"); if (missing.length) throw new Error(`YAYIN_KONTROL_LISTESI: ${missing.join(", ")}`); }

export function applyWorkflowAction(articleId: number, action: string, note: string, actor: AdminUser, assigneeId?: number | null) {
  const db = getDb(); const now = Date.now(); const row = db.prepare("SELECT * FROM articles WHERE id=?").get(articleId) as Record<string, unknown> | undefined; if (!row) throw new Error("ARTICLE_NOT_FOUND"); const article = mapArticle(row);
  const transitions: Record<string, WorkflowState> = { submit_review: "editor_review", request_changes: "changes_requested", approve: "approved", reject: "rejected", publish: "published", withdraw: "withdrawn", reopen: "reporter_draft" };
  if (action === "assign") { db.prepare("UPDATE articles SET assigned_to=?,updated_at=? WHERE id=?").run(assigneeId ?? null, now, articleId); }
  else if (action === "correction") { if (article.workflowState !== "published") throw new Error("INVALID_TRANSITION"); db.prepare("UPDATE articles SET correction_note=?,edit_version=edit_version+1,updated_at=? WHERE id=?").run(note.trim().slice(0, 1000), now, articleId); db.prepare("INSERT INTO workflow_events (article_id,action,from_state,to_state,actor_id,actor_name,note,created_at) VALUES (?,?,?,?,?,?,?,?)").run(articleId, action, article.workflowState, article.workflowState, actor.id, actor.fullName, note.trim().slice(0, 1000), now); }
  else { const next = transitions[action]; if (!next) throw new Error("INVALID_ACTION"); const allowedFrom: Record<string, WorkflowState[]> = { submit_review: ["reporter_draft", "changes_requested", "rejected"], request_changes: ["editor_review"], approve: ["editor_review"], reject: ["editor_review", "approved"], publish: ["approved"], withdraw: ["published"], reopen: ["rejected", "withdrawn"] }; if (!allowedFrom[action]?.includes(article.workflowState)) throw new Error("INVALID_TRANSITION"); if (["approve", "publish"].includes(action)) publicationChecklist(article); const status: ArticleStatus = next === "published" ? "published" : next === "editor_review" ? "review" : "draft"; db.prepare("UPDATE articles SET workflow_state=?,status=?,correction_note=CASE WHEN ?='withdrawn' THEN ? ELSE correction_note END,withdrawn_at=CASE WHEN ?='withdrawn' THEN ? ELSE NULL END,published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE published_at END,edit_version=edit_version+1,updated_at=? WHERE id=?").run(next, status, next, note.trim(), next, now, next, now, now, articleId); db.prepare("INSERT INTO workflow_events (article_id,action,from_state,to_state,actor_id,actor_name,note,created_at) VALUES (?,?,?,?,?,?,?,?)").run(articleId, action, article.workflowState, next, actor.id, actor.fullName, note.trim().slice(0, 1000), now); }
  db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,?,?,?,?)").run(articleId, action, actor.fullName, JSON.stringify({ note, assigneeId }), now); return mapArticle(db.prepare("SELECT * FROM articles WHERE id=?").get(articleId) as Record<string, unknown>);
}

function mapNewsSource(row: Record<string, unknown>): NewsSource { const secretEnv = String(row.secret_env || ""); return { id: Number(row.id), name: String(row.name), url: String(row.url), type: String(row.type), provider: String(row.provider || "other"), feedFormat: String(row.feed_format || "rss"), authType: String(row.auth_type || "none"), secretEnv, credentialReady: String(row.auth_type || "none") === "none" || Boolean(secretEnv && process.env[secretEnv]), pollIntervalMinutes: Number(row.poll_interval_minutes || 15), publishMode: String(row.publish_mode || "review"), defaultCategory: String(row.default_category || "Gündem"), categoryMap: String(row.category_map || "{}"), disclaimer: String(row.disclaimer || ""), active: Number(row.active), lastCheckedAt: row.last_checked_at == null ? null : Number(row.last_checked_at), lastSuccessAt: row.last_success_at == null ? null : Number(row.last_success_at), lastError: String(row.last_error || ""), nextPollAt: row.next_poll_at == null ? null : Number(row.next_poll_at), itemCount: Number(row.item_count || 0), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at || row.created_at) }; }
export function listNewsSources() { return (getDb().prepare("SELECT s.*,COUNT(ai.id) AS item_count FROM news_sources s LEFT JOIN agency_items ai ON ai.source_id=s.id GROUP BY s.id ORDER BY s.active DESC,s.name").all() as Record<string, unknown>[]).map(mapNewsSource); }
export function getNewsSource(id: number) { const row = getDb().prepare("SELECT s.*,COUNT(ai.id) AS item_count FROM news_sources s LEFT JOIN agency_items ai ON ai.source_id=s.id WHERE s.id=? GROUP BY s.id").get(id) as Record<string, unknown> | undefined; return row ? mapNewsSource(row) : null; }
export function saveNewsSource(input: Omit<NewsSource, "id" | "credentialReady" | "lastCheckedAt" | "lastSuccessAt" | "lastError" | "nextPollAt" | "itemCount" | "createdAt" | "updatedAt"> & { id?: number }, actor = "Yayın Yönetmeni") {
  const db = getDb(); const now = Date.now(); const values = { ...input, active: input.active ? 1 : 0, now };
  let id = input.id;
  if (id) db.prepare(`UPDATE news_sources SET name=@name,url=@url,type=@type,provider=@provider,feed_format=@feedFormat,auth_type=@authType,secret_env=@secretEnv,poll_interval_minutes=@pollIntervalMinutes,publish_mode=@publishMode,default_category=@defaultCategory,category_map=@categoryMap,disclaimer=@disclaimer,active=@active,next_poll_at=CASE WHEN @active=1 THEN COALESCE(next_poll_at,@now) ELSE NULL END,updated_at=@now WHERE id=@id`).run(values);
  else id = Number(db.prepare(`INSERT INTO news_sources (name,url,type,provider,feed_format,auth_type,secret_env,poll_interval_minutes,publish_mode,default_category,category_map,disclaimer,active,last_checked_at,last_success_at,last_error,next_poll_at,created_at,updated_at) VALUES (@name,@url,@type,@provider,@feedFormat,@authType,@secretEnv,@pollIntervalMinutes,@publishMode,@defaultCategory,@categoryMap,@disclaimer,@active,NULL,NULL,'',CASE WHEN @active=1 THEN @now ELSE NULL END,@now,@now)`).run(values).lastInsertRowid);
  db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('news_source',?,?,?,?,?)").run(id, input.id ? "update" : "create", actor, JSON.stringify({ name: input.name, provider: input.provider, publishMode: input.publishMode, active: values.active }), now);
  return getNewsSource(id)!;
}
export function addNewsSource(input: { name: string; url: string; type?: string }) { return saveNewsSource({ name: input.name.trim(), url: input.url.trim(), type: input.type || "website", provider: "other", feedFormat: input.type === "rss" ? "rss" : "rss", authType: "none", secretEnv: "", pollIntervalMinutes: 15, publishMode: "review", defaultCategory: "Gündem", categoryMap: "{}", disclaimer: "", active: 1 }).id; }
export function listDueNewsSources(now = Date.now()) { return listNewsSources().filter((source) => source.type === "agency" && source.active && (!source.nextPollAt || source.nextPollAt <= now)); }
export function markNewsSourceCheck(id: number, result: { ok: boolean; error?: string }) { const now = Date.now(); const source = getNewsSource(id); if (!source) return; const next = now + source.pollIntervalMinutes * 60_000; getDb().prepare("UPDATE news_sources SET last_checked_at=?,last_success_at=CASE WHEN ?=1 THEN ? ELSE last_success_at END,last_error=?,next_poll_at=?,updated_at=? WHERE id=?").run(now, result.ok ? 1 : 0, now, result.ok ? "" : String(result.error || "Bilinmeyen ajans hatası").slice(0, 500), next, now, id); }

export type AgencyArticleInput = { externalId: string; title: string; spot: string; body: string; blocks: ContentBlock[]; category: string; author: string; sourceUrl: string; publishedAt: number | null; updatedAt: number | null; status: "published" | "updated" | "withdrawn"; payloadHash: string; raw: unknown; credit: string };
export function upsertAgencyArticle(source: NewsSource, input: AgencyArticleInput) {
  const db = getDb(); const now = Date.now();
  const existingItem = db.prepare("SELECT * FROM agency_items WHERE source_id=? AND external_id=?").get(source.id, input.externalId) as Record<string, unknown> | undefined;
  if (existingItem && agencyUpdateDecision({ payloadHash: existingItem.payload_hash, pendingHash: existingItem.pending_hash }, input.payloadHash, false) === "unchanged") return { action: "unchanged" as const, articleId: existingItem.article_id == null ? null : Number(existingItem.article_id) };
  return db.transaction(() => {
    const articleId = existingItem?.article_id == null ? null : Number(existingItem.article_id);
    const linkedArticle = articleId ? getAdminArticle(articleId) : null;
    if (existingItem && agencyUpdateDecision({ payloadHash: existingItem.payload_hash, pendingHash: existingItem.pending_hash }, input.payloadHash, Boolean(linkedArticle?.agencyEditorialLock)) === "pending") return { action: "pending" as const, articleId };
    if (input.status === "withdrawn") {
      if (articleId) {
        db.prepare("UPDATE articles SET status='draft',workflow_state='withdrawn',withdrawn_at=?,edit_version=edit_version+1,updated_at=? WHERE id=?").run(now, now, articleId);
        db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,'agency_withdraw',?,?,?)").run(articleId, `${source.name} otomasyonu`, JSON.stringify({ externalId: input.externalId }), now);
      }
      db.prepare(`INSERT INTO agency_items (source_id,external_id,article_id,status,payload_hash,pending_hash,raw_payload,source_published_at,source_updated_at,received_at,processed_at) VALUES (?,?,?,?,?,'',?,?,?,?,?) ON CONFLICT(source_id,external_id) DO UPDATE SET status=excluded.status,payload_hash=excluded.payload_hash,pending_hash='',raw_payload=excluded.raw_payload,source_updated_at=excluded.source_updated_at,received_at=excluded.received_at,processed_at=excluded.processed_at`).run(source.id, input.externalId, articleId, input.status, input.payloadHash, JSON.stringify(input.raw), input.publishedAt, input.updatedAt, now, now);
      return { action: "withdrawn" as const, articleId };
    }
    if (articleId && linkedArticle?.agencyEditorialLock) {
      db.prepare("UPDATE agency_items SET status='pending_update',pending_hash=?,raw_payload=?,source_published_at=?,source_updated_at=?,received_at=?,processed_at=? WHERE id=?").run(input.payloadHash, JSON.stringify(input.raw), input.publishedAt, input.updatedAt, now, now, Number(existingItem!.id));
      db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,'agency_update_pending',?,?,?)").run(articleId, `${source.name} otomasyonu`, JSON.stringify({ externalId: input.externalId }), now);
      return { action: "pending" as const, articleId };
    }
    const status: ArticleStatus = source.publishMode === "auto" ? "published" : "review";
    const workflowState: WorkflowState = source.publishMode === "auto" ? "published" : "editor_review";
    const baseSlug = slugify(input.title) || `ajans-${source.id}-${input.externalId}`;
    let slug = baseSlug; let suffix = 2;
    while (true) { const clash = db.prepare("SELECT id FROM articles WHERE slug=?").get(slug) as { id: number } | undefined; if (!clash || clash.id === articleId) break; slug = `${baseSlug}-${suffix++}`; }
    const heroBlock = input.blocks.find((block) => block.type === "image");
    const contentBlocks = heroBlock ? input.blocks.filter((block) => block.id !== heroBlock.id) : input.blocks;
    const values = { ...input, slug, status, workflowState, sourceName: source.name, heroImage: heroBlock?.content || "/news/gorsel-yok.svg", imageAlt: heroBlock?.caption || input.title, videoUrl: input.blocks.find((block) => block.type === "video")?.content || "", contentBlocks: JSON.stringify(contentBlocks.length ? contentBlocks : [{ id: `agency-${source.id}`, type: "paragraph", content: input.body }]), publishedAt: status === "published" ? (input.publishedAt || now) : null, agencyCredit: input.credit || source.name, now };
    let id = articleId;
    if (id) {
      const current = mapArticle(db.prepare("SELECT * FROM articles WHERE id=?").get(id) as Record<string, unknown>);
      db.prepare("INSERT OR IGNORE INTO article_revisions (article_id,version,snapshot,actor_id,actor_name,reason,created_at) VALUES (?,?,?,NULL,?,'agency_update',?)").run(id, current.editVersion, JSON.stringify(current), `${source.name} otomasyonu`, now);
      db.prepare(`UPDATE articles SET slug=@slug,title=@title,spot=@spot,body=@body,content_blocks=@contentBlocks,category=@category,status=@status,workflow_state=@workflowState,hero_image=@heroImage,image_alt=@imageAlt,video_url=@videoUrl,author=@author,source_name=@sourceName,source_url=@sourceUrl,seo_title=@title,seo_description=@spot,published_at=COALESCE(published_at,@publishedAt),agency_credit=@agencyCredit,agency_received_at=@now,edit_version=edit_version+1,updated_at=@now WHERE id=@id`).run({ ...values, id });
    } else id = Number(db.prepare(`INSERT INTO articles (slug,title,spot,body,content_blocks,category,status,workflow_state,hero_image,image_alt,video_url,author,source_name,source_url,seo_title,seo_description,is_breaking,is_featured,homepage_order,published_at,scheduled_at,agency_source_id,agency_external_id,agency_credit,agency_received_at,agency_editorial_lock,created_at,updated_at) VALUES (@slug,@title,@spot,@body,@contentBlocks,@category,@status,@workflowState,@heroImage,@imageAlt,@videoUrl,@author,@sourceName,@sourceUrl,@title,@spot,0,0,500,@publishedAt,NULL,${source.id},@externalId,@agencyCredit,@now,${source.publishMode === "review" ? 1 : 0},@now,@now)`).run(values).lastInsertRowid);
    db.prepare(`INSERT INTO agency_items (source_id,external_id,article_id,status,payload_hash,pending_hash,raw_payload,source_published_at,source_updated_at,received_at,processed_at) VALUES (?,?,?,?,?,'',?,?,?,?,?) ON CONFLICT(source_id,external_id) DO UPDATE SET article_id=excluded.article_id,status=excluded.status,payload_hash=excluded.payload_hash,pending_hash='',raw_payload=excluded.raw_payload,source_published_at=excluded.source_published_at,source_updated_at=excluded.source_updated_at,received_at=excluded.received_at,processed_at=excluded.processed_at`).run(source.id, input.externalId, id, input.status, input.payloadHash, JSON.stringify(input.raw), input.publishedAt, input.updatedAt, now, now);
    db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,?,?,?,?)").run(id, articleId ? "agency_update" : "agency_import", `${source.name} otomasyonu`, JSON.stringify({ externalId: input.externalId, publishMode: source.publishMode }), now);
    return { action: articleId ? "updated" as const : "created" as const, articleId: id };
  })();
}
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

/* Doğrudan reklam envanteri: konumlar kod sözleşmesidir, kampanya/kreatif/tarih
   yönetim panelinden değiştirilir. Harici reklam ağı bağlandığında aynı konum kodları korunur. */
export type AdvertisementInput = Omit<AdvertisementRecord, "id" | "state" | "createdAt" | "updatedAt"> & { id?: number };

export function listAdvertisements(limit = 200) {
  return (getDb().prepare("SELECT * FROM advertisements ORDER BY active DESC,placement,priority DESC,updated_at DESC LIMIT ?").all(Math.min(Math.max(limit, 1), 500)) as Record<string, unknown>[]).map(mapAdvertisement);
}

export function getAdvertisement(id: number) {
  const row = getDb().prepare("SELECT * FROM advertisements WHERE id=?").get(id) as Record<string, unknown> | undefined;
  return row ? mapAdvertisement(row) : null;
}

export function getActiveAdvertisement(placement: string, now = Date.now()) {
  const row = getDb().prepare(`SELECT * FROM advertisements
    WHERE placement=? AND active=1 AND (starts_at IS NULL OR starts_at<=?) AND (ends_at IS NULL OR ends_at>?)
    ORDER BY priority DESC,updated_at DESC,id DESC LIMIT 1`).get(placement, now, now) as Record<string, unknown> | undefined;
  return row ? mapAdvertisement(row) : null;
}

export class AdvertisementConflictError extends Error { constructor() { super("Bu reklam başka bir yönetici tarafından güncellendi. En son sürümü açıp değişikliğinizi yeniden uygulayın."); this.name = "AdvertisementConflictError"; } }
export class AdvertisementNotFoundError extends Error { constructor() { super("Reklam kaydı bulunamadı."); this.name = "AdvertisementNotFoundError"; } }
type AdvertisementActor = string | Pick<AdminUser, "id" | "fullName" | "role">;

function advertisementAuditSnapshot(value: AdvertisementInput | AdvertisementRecord) {
  return {
    placement: value.placement, advertiser: value.advertiser, campaignName: value.campaignName,
    title: value.title, description: value.description, imageUrl: value.imageUrl, targetUrl: value.targetUrl,
    ctaLabel: value.ctaLabel, theme: value.theme, kind: value.kind, priority: value.priority,
    active: Number(value.active), startsAt: value.startsAt ?? null, endsAt: value.endsAt ?? null,
  };
}

export function saveAdvertisement(input: AdvertisementInput, actor: AdvertisementActor = "Yayın Yönetmeni", expectedUpdatedAt?: number) {
  const db = getDb();
  let id = input.id;
  db.transaction(() => {
    const current = id ? getAdvertisement(id) : null;
    if (id && !current) throw new AdvertisementNotFoundError();
    if (id && (!Number.isSafeInteger(expectedUpdatedAt) || expectedUpdatedAt !== current!.updatedAt)) throw new AdvertisementConflictError();
    const now = current ? Math.max(Date.now(), current.updatedAt + 1) : Date.now();
    const values = { ...input, active: input.active ? 1 : 0, startsAt: input.startsAt ?? null, endsAt: input.endsAt ?? null, now, expectedUpdatedAt };
    if (id) {
      const result = db.prepare(`UPDATE advertisements SET placement=@placement,advertiser=@advertiser,campaign_name=@campaignName,title=@title,description=@description,image_url=@imageUrl,target_url=@targetUrl,cta_label=@ctaLabel,theme=@theme,kind=@kind,priority=@priority,active=@active,starts_at=@startsAt,ends_at=@endsAt,updated_at=@now WHERE id=@id AND updated_at=@expectedUpdatedAt`).run(values);
      if (!result.changes) throw new AdvertisementConflictError();
    } else {
      id = Number(db.prepare(`INSERT INTO advertisements (placement,advertiser,campaign_name,title,description,image_url,target_url,cta_label,theme,kind,priority,active,starts_at,ends_at,created_at,updated_at)
        VALUES (@placement,@advertiser,@campaignName,@title,@description,@imageUrl,@targetUrl,@ctaLabel,@theme,@kind,@priority,@active,@startsAt,@endsAt,@now,@now)`).run(values).lastInsertRowid);
    }
    const actorName = typeof actor === "string" ? actor : actor.fullName;
    db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('advertisement',?,?,?,?,?)")
      .run(id, input.id ? "update" : "create", actorName, JSON.stringify({
        actor: typeof actor === "string" ? { name: actor } : { id: actor.id, name: actor.fullName, role: actor.role },
        before: current ? advertisementAuditSnapshot(current) : null,
        after: advertisementAuditSnapshot({ ...input, active: values.active, startsAt: values.startsAt, endsAt: values.endsAt }),
      }), now);
  })();
  return getAdvertisement(id!)!;
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

/* Eski site içerik aktarımı: keşfedilen adresler, aktarım durumu ve tekrar çalıştırılabilirlik. */
export type ImportItem = { id: number; sourceUrl: string; sourcePath: string; sourceLastmod: number | null; status: "pending" | "imported" | "skipped" | "failed"; articleId: number | null; title: string; message: string; discoveredAt: number; processedAt: number | null };

function mapImportItem(row: Record<string, unknown>): ImportItem {
  return { id: Number(row.id), sourceUrl: String(row.source_url), sourcePath: String(row.source_path), sourceLastmod: row.source_lastmod == null ? null : Number(row.source_lastmod), status: row.status as ImportItem["status"], articleId: row.article_id == null ? null : Number(row.article_id), title: String(row.title), message: String(row.message), discoveredAt: Number(row.discovered_at), processedAt: row.processed_at == null ? null : Number(row.processed_at) };
}

/* Keşif tekrar çalıştırılabilir: var olan adres yeniden eklenmez, durumu korunur. */
export function recordDiscoveredUrls(entries: { url: string; lastmod: number | null }[]) {
  const db = getDb();
  const now = Date.now();
  let added = 0;
  const statement = db.prepare("INSERT INTO import_items (source_url,source_path,source_lastmod,status,discovered_at) VALUES (?,?,?,'pending',?) ON CONFLICT(source_url) DO NOTHING");
  db.transaction(() => {
    for (const entry of entries) {
      const path = legacyPath(entry.url);
      if (!path) continue;
      added += statement.run(entry.url, path, entry.lastmod, now).changes;
    }
  })();
  return added;
}

export function listImportItems(status: ImportItem["status"] | "all" = "all", limit = 50) {
  const safeLimit = Math.min(Math.max(limit, 1), 200);
  const rows = status === "all"
    ? getDb().prepare("SELECT * FROM import_items ORDER BY processed_at DESC, source_lastmod DESC LIMIT ?").all(safeLimit)
    : getDb().prepare("SELECT * FROM import_items WHERE status=? ORDER BY source_lastmod DESC LIMIT ?").all(status, safeLimit);
  return (rows as Record<string, unknown>[]).map(mapImportItem);
}

export function takePendingImportItems(limit = 20) {
  return (getDb().prepare("SELECT * FROM import_items WHERE status='pending' ORDER BY source_lastmod DESC LIMIT ?").all(Math.min(Math.max(limit, 1), 50)) as Record<string, unknown>[]).map(mapImportItem);
}

/* Ana sayfa eşitlemesi büyük arşiv kuyruğundan bağımsız çalışır: yalnız eski sitenin
   o anda görünür olan adresleri, kaynakta göründükleri sırayla seçilir. */
export function takePendingImportItemsByUrls(urls: string[]) {
  const ordered = [...new Set(urls)].slice(0, 50);
  if (!ordered.length) return [];
  const placeholders = ordered.map(() => "?").join(",");
  const rows = getDb().prepare(`SELECT * FROM import_items WHERE status='pending' AND source_url IN (${placeholders})`).all(...ordered) as Record<string, unknown>[];
  const byUrl = new Map(rows.map((row) => [String(row.source_url), mapImportItem(row)]));
  return ordered.map((url) => byUrl.get(url)).filter((item): item is ImportItem => Boolean(item));
}

/* Eski sitenin vitrini geçiş döneminde yayın sırasının kaynağıdır. İlk beş haber manşete,
   ilk haber de flaş/son dakika bandına alınır. Yalnız kozatv.com.tr aktarım kayıtları
   etkilenir; editörün yeni sitede elle hazırladığı seçimler korunur. */
export function applyLegacyHomepageOrder(urls: string[]) {
  const db = getDb();
  const ordered = [...new Set(urls)].slice(0, 50);
  let matched = 0;
  db.transaction(() => {
    db.prepare("UPDATE articles SET is_featured=0,is_breaking=0,homepage_order=500 WHERE source_name='kozatv.com.tr'").run();
    const update = db.prepare("UPDATE articles SET is_featured=?,is_breaking=?,homepage_order=?,updated_at=? WHERE source_name='kozatv.com.tr' AND source_url=? AND status='published'");
    ordered.forEach((url, index) => {
      matched += update.run(index < 5 ? 1 : 0, index === 0 ? 1 : 0, index + 1, Date.now(), url).changes;
    });
  })();
  return matched;
}

export function getImportStats() {
  const rows = getDb().prepare("SELECT status, COUNT(*) AS total FROM import_items GROUP BY status").all() as { status: string; total: number }[];
  const stats = { total: 0, pending: 0, imported: 0, skipped: 0, failed: 0, withoutImage: 0 } as Record<string, number>;
  for (const row of rows) { stats[row.status] = row.total; stats.total += row.total; }
  stats.withoutImage = Number((getDb().prepare("SELECT COUNT(*) AS total FROM articles WHERE source_name='kozatv.com.tr' AND hero_image='/news/gorsel-yok.svg'").get() as { total: number }).total);
  return stats;
}

export function markImportItem(id: number, status: ImportItem["status"], detail: { articleId?: number | null; title?: string; message?: string } = {}) {
  getDb().prepare("UPDATE import_items SET status=?, article_id=?, title=?, message=?, processed_at=? WHERE id=?")
    .run(status, detail.articleId ?? null, (detail.title ?? "").slice(0, 200), (detail.message ?? "").slice(0, 300), Date.now(), id);
}

export function resetFailedImports() {
  return getDb().prepare("UPDATE import_items SET status='pending', message='', processed_at=NULL WHERE status='failed'").run().changes;
}

export function findArticleBySourceUrl(sourceUrl: string) {
  const row = getDb().prepare("SELECT * FROM articles WHERE source_url=?").get(sourceUrl) as Record<string, unknown> | undefined;
  return row ? mapArticle(row) : null;
}

export function getArticleBySlugAnyStatus(slug: string) {
  const row = getDb().prepare("SELECT * FROM articles WHERE slug=?").get(slug) as Record<string, unknown> | undefined;
  return row ? mapArticle(row) : null;
}

/* Aktarılan haberi doğrudan yazar. Editoryal onay akışı arşiv aktarımı için atlanır; kaynak
   adres ve özgün yayın tarihi korunur, işlem denetim kaydına yazılır. */
export function importLegacyArticle(input: { slug: string; title: string; spot: string; body: string; blocks: { type: string; content: string }[]; category: string; author: string; heroImage: string; imageAlt: string; sourceUrl: string; seoTitle: string; seoDescription: string; publishedAt: number | null; status: "draft" | "published" }, actor = "İçerik Aktarımı") {
  const db = getDb();
  const now = Date.now();
  const blocks = input.blocks.map((block, index) => ({ id: `import-${index}`, type: block.type, content: block.content }));
  const values = {
    ...input,
    contentBlocks: JSON.stringify(blocks),
    workflowState: input.status === "published" ? "published" : "reporter_draft",
    publishedAt: input.status === "published" ? (input.publishedAt ?? now) : null,
    sourceName: "kozatv.com.tr",
    now,
  };
  const existing = db.prepare("SELECT id FROM articles WHERE source_url=? OR slug=?").get(input.sourceUrl, input.slug) as { id: number } | undefined;
  let id: number;
  if (existing) {
    db.prepare(`UPDATE articles SET title=@title,spot=@spot,body=@body,content_blocks=@contentBlocks,category=@category,status=@status,workflow_state=@workflowState,hero_image=@heroImage,image_alt=@imageAlt,author=@author,source_name=@sourceName,source_url=@sourceUrl,seo_title=@seoTitle,seo_description=@seoDescription,published_at=@publishedAt,edit_version=edit_version+1,updated_at=@now WHERE id=@id`).run({ ...values, id: existing.id });
    id = existing.id;
  } else {
    const result = db.prepare(`INSERT INTO articles (slug,title,spot,body,content_blocks,category,status,workflow_state,hero_image,image_alt,video_url,author,source_name,source_url,seo_title,seo_description,is_breaking,is_featured,homepage_order,published_at,scheduled_at,created_at,updated_at) VALUES (@slug,@title,@spot,@body,@contentBlocks,@category,@status,@workflowState,@heroImage,@imageAlt,'',@author,@sourceName,@sourceUrl,@seoTitle,@seoDescription,0,0,500,@publishedAt,NULL,@now,@now)`).run(values);
    id = Number(result.lastInsertRowid);
  }
  db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,'import',?,?,?)").run(id, actor, JSON.stringify({ sourceUrl: input.sourceUrl, status: input.status }), now);
  return mapArticle(db.prepare("SELECT * FROM articles WHERE id=?").get(id) as Record<string, unknown>);
}

/* Aktarılan kategori sitede yoksa menüde gizli olarak açılır; yönetici sonradan görünür yapar. */
export function ensureCategory(name: string, actor = "İçerik Aktarımı") {
  const clean = name.trim().slice(0, 60);
  if (!clean) return null;
  const existing = getDb().prepare("SELECT name FROM categories WHERE name=? COLLATE NOCASE").get(clean) as { name: string } | undefined;
  if (existing) return existing.name;
  const now = Date.now();
  const slug = slugify(clean);
  if (!slug) return null;
  const clash = getDb().prepare("SELECT name FROM categories WHERE slug=?").get(slug) as { name: string } | undefined;
  if (clash) return clash.name;
  getDb().prepare("INSERT INTO categories (name,slug,description,seo_title,seo_description,color,nav_order,is_visible,created_at,updated_at) VALUES (?,?,?,?,?,?,?,0,?,?)")
    .run(clean, slug, `${clean} haberleri`, "", "", "#c92721", 200, now, now);
  getDb().prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('category',0,'import_create',?,?,?)").run(actor, JSON.stringify({ name: clean }), now);
  return clean;
}

/* Ana sayfa akışları için saf tarih sıralı liste. `listPublishedArticles` manşet sabitlemesi
   yaptığı için arşiv aktarımından sonra güncel haberleri geri planda bırakıyordu. */
export function listLatestArticles(limit = 30) {
  publishDueArticles();
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  return (getDb().prepare("SELECT * FROM articles WHERE status='published' ORDER BY published_at DESC, id DESC LIMIT ?").all(safeLimit) as Record<string, unknown>[]).map(mapArticle);
}

/* Kategori sayfalaması: arşiv aktarımından sonra bazı kategorilerde yüzlerce haber var;
   ilk 30 kayıttan sonrası erişilemez kalmamalı. */
export function listCategoryPage(category: string, page = 1, perPage = 18) {
  publishDueArticles();
  const size = Math.min(Math.max(perPage, 6), 48);
  const current = Math.max(page, 1);
  const total = Number((getDb().prepare("SELECT COUNT(*) AS total FROM articles WHERE status='published' AND category=?").get(category) as { total: number }).total);
  const rows = getDb().prepare("SELECT * FROM articles WHERE status='published' AND category=? ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?").all(category, size, (current - 1) * size) as Record<string, unknown>[];
  return { articles: rows.map(mapArticle), total, page: current, perPage: size, pageCount: Math.max(1, Math.ceil(total / size)) };
}

/* Kapak görseli inememiş aktarım haberleri: sebebini görmek ve yeniden denemek için. */
export function listArticlesMissingImage(limit = 25) {
  return (getDb().prepare("SELECT * FROM articles WHERE source_name='kozatv.com.tr' AND hero_image='/news/gorsel-yok.svg' AND source_url<>'' ORDER BY published_at DESC LIMIT ?").all(Math.min(Math.max(limit, 1), 50)) as Record<string, unknown>[]).map(mapArticle);
}

export function setArticleHeroImage(id: number, heroImage: string) {
  getDb().prepare("UPDATE articles SET hero_image=?, updated_at=? WHERE id=?").run(heroImage, Date.now(), id);
}
