import assert from 'node:assert/strict';
import test from 'node:test';
import Database from 'better-sqlite3';

function fixture(publisher) {
  const db = new Database(':memory:');
  db.exec(`CREATE TABLE site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at INTEGER NOT NULL, updated_by TEXT NOT NULL DEFAULT '');
    CREATE TABLE audit_logs (entity_type TEXT, entity_id INTEGER, action TEXT, actor TEXT, detail TEXT, created_at INTEGER);`);
  const insert = db.prepare('INSERT INTO site_settings(key,value,updated_at,updated_by) VALUES(?,?,1,?)');
  if (publisher !== undefined) insert.run('googleAdSenseId', publisher, 'Yönetici');
  insert.run('googleAdSenseEnabled', '0', 'Yönetici');
  insert.run('googleTagManagerId', 'GTM-5D3KDTPX', 'Yönetici');
  return db;
}

test('eski AdSense yayıncısı tek seferde yenilenir; sonraki yönetici tercihi ve diğer ayarlar korunur', async () => {
  const { migrateAdSensePublisher } = await import('../db/google-publisher-migration.mjs');
  const db = fixture('ca-pub-7808964787779354');
  try {
    assert.equal(migrateAdSensePublisher(db), true);
    assert.equal(db.prepare("SELECT value FROM site_settings WHERE key='googleAdSenseId'").get().value, 'ca-pub-8257810988134211');
    assert.equal(db.prepare("SELECT value FROM site_settings WHERE key='googleAdSenseEnabled'").get().value, '0');
    assert.equal(db.prepare("SELECT value FROM site_settings WHERE key='googleTagManagerId'").get().value, 'GTM-5D3KDTPX');
    const audit = db.prepare('SELECT * FROM audit_logs').all();
    assert.equal(audit.length, 1);
    assert.deepEqual(JSON.parse(audit[0].detail), { key: 'googleAdSenseId', from: 'ca-pub-7808964787779354', to: 'ca-pub-8257810988134211' });
    db.prepare("UPDATE site_settings SET value='' WHERE key='googleAdSenseId'").run();
    assert.equal(migrateAdSensePublisher(db), false);
    assert.equal(db.prepare("SELECT value FROM site_settings WHERE key='googleAdSenseId'").get().value, '');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count, 1);
  } finally { db.close(); }
});

test('boş, farklı, zaten güncel veya kayıtlı olmayan AdSense ayarı geçişte ezilmez', async () => {
  const { migrateAdSensePublisher } = await import('../db/google-publisher-migration.mjs');
  for (const value of ['', 'ca-pub-1234567890123456', 'ca-pub-8257810988134211', undefined]) {
    const db = fixture(value);
    try {
      assert.equal(migrateAdSensePublisher(db), false);
      assert.equal(db.prepare("SELECT value FROM site_settings WHERE key='googleAdSenseId'").get()?.value, value);
      assert.equal(db.prepare('SELECT COUNT(*) AS count FROM audit_logs').get().count, 0);
      assert.equal(migrateAdSensePublisher(db), false);
    } finally { db.close(); }
  }
});

test('AdSense geçişi kayıt hatasında ayarı ve tek seferlik işareti birlikte geri alır', async () => {
  const { migrateAdSensePublisher } = await import('../db/google-publisher-migration.mjs');
  const db = fixture('ca-pub-7808964787779354');
  try {
    db.exec("CREATE TRIGGER reject_audit BEFORE INSERT ON audit_logs BEGIN SELECT RAISE(ABORT,'test audit failure'); END;");
    assert.throws(() => migrateAdSensePublisher(db), /test audit failure/);
    assert.equal(db.prepare("SELECT value FROM site_settings WHERE key='googleAdSenseId'").get().value, 'ca-pub-7808964787779354');
    db.exec('DROP TRIGGER reject_audit');
    assert.equal(migrateAdSensePublisher(db), true);
  } finally { db.close(); }
});
