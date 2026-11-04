import { googleDefaults } from './google-model.mjs';

// Yalnız değiştirilen eski hesabı bir kez taşı; sonraki panel tercihlerini koru.
export function migrateAdSensePublisher(db) {
  return db.transaction(() => {
    const now = Date.now();
    const marker = db.prepare("INSERT INTO site_settings(key,value,updated_at,updated_by) VALUES(?,?,?,'Sistem') ON CONFLICT(key) DO NOTHING")
      .run('_google_adsense_publisher_8257810988134211_v1', '1', now);
    if (!marker.changes) return false;
    const previous = 'ca-pub-7808964787779354';
    const next = googleDefaults.googleAdSenseId;
    const result = db.prepare("UPDATE site_settings SET value=?,updated_at=?,updated_by='Sistem' WHERE key='googleAdSenseId' AND value=?")
      .run(next, now, previous);
    if (!result.changes) return false;
    db.prepare("INSERT INTO audit_logs(entity_type,entity_id,action,actor,detail,created_at) VALUES('site_settings',0,'update','Sistem',?,?)")
      .run(JSON.stringify({ key: 'googleAdSenseId', from: previous, to: next }), now);
    return true;
  })();
}
