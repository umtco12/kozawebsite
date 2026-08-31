import { adPlacements } from "./ad-model.mjs";

const placementSql = adPlacements.map(({ key }) => `'${key}'`).join(",");
const advertisementColumns = "id,placement,advertiser,campaign_name,title,description,image_url,target_url,cta_label,theme,kind,priority,active,starts_at,ends_at,created_at,updated_at";

const createTableSql = `
  CREATE TABLE advertisements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    placement TEXT NOT NULL CHECK (placement IN (${placementSql})),
    advertiser TEXT NOT NULL,
    campaign_name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    target_url TEXT NOT NULL DEFAULT '',
    cta_label TEXT NOT NULL DEFAULT '',
    theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('red','dark','light')),
    kind TEXT NOT NULL DEFAULT 'direct' CHECK (kind IN ('house','direct','programmatic')),
    priority INTEGER NOT NULL DEFAULT 100 CHECK (typeof(priority)='integer' AND priority BETWEEN 1 AND 999),
    active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0,1)),
    starts_at INTEGER,
    ends_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    CHECK (starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at)
  );`;

const createSupportSql = `
  CREATE INDEX IF NOT EXISTS idx_advertisements_delivery ON advertisements(placement,active,priority DESC,starts_at,ends_at);
  CREATE TRIGGER IF NOT EXISTS trg_advertisements_validate_insert BEFORE INSERT ON advertisements
  WHEN NEW.placement NOT IN (${placementSql}) OR typeof(NEW.priority)<>'integer' OR NEW.priority NOT BETWEEN 1 AND 999 OR NEW.active NOT IN (0,1) OR (NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL AND NEW.starts_at>=NEW.ends_at)
  BEGIN SELECT RAISE(ABORT,'Geçersiz reklam kaydı'); END;
  CREATE TRIGGER IF NOT EXISTS trg_advertisements_validate_update BEFORE UPDATE ON advertisements
  WHEN NEW.placement NOT IN (${placementSql}) OR typeof(NEW.priority)<>'integer' OR NEW.priority NOT BETWEEN 1 AND 999 OR NEW.active NOT IN (0,1) OR (NEW.starts_at IS NOT NULL AND NEW.ends_at IS NOT NULL AND NEW.starts_at>=NEW.ends_at)
  BEGIN SELECT RAISE(ABORT,'Geçersiz reklam kaydı'); END;`;

/**
 * SQLite CHECK kısıtları ALTER TABLE ile genişletilemediğinden, eski dört alanlı
 * tabloyu tek transaction içinde yeniden kurar. Kayıt kimlikleri ve kampanya
 * tarihleri aynen korunur; ikinci çalıştırma veri kopyalamadan no-op olur.
 */
export function ensureAdvertisementSchema(db) {
  const current = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='advertisements'").get();
  const needsMigration = current && adPlacements.some(({ key }) => !String(current.sql || "").includes(`'${key}'`));

  if (!current) {
    db.exec(createTableSql);
  } else if (needsMigration) {
    db.transaction(() => {
      db.exec(`
        DROP TRIGGER IF EXISTS trg_advertisements_validate_insert;
        DROP TRIGGER IF EXISTS trg_advertisements_validate_update;
        DROP INDEX IF EXISTS idx_advertisements_delivery;
        ALTER TABLE advertisements RENAME TO advertisements_legacy_four_slots;
        ${createTableSql}
        INSERT INTO advertisements (${advertisementColumns})
        SELECT ${advertisementColumns} FROM advertisements_legacy_four_slots;
        DROP TABLE advertisements_legacy_four_slots;
      `);
    })();
  }

  db.exec(createSupportSql);
}
