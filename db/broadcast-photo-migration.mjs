/* Canlı akıştaki tek eski fotoğrafı, yönetici tarafından değiştirilmiş bir
   programı ezmeden yeni saydam portreye geçirir. İşlem bütün sunucularda bir kez yapılır. */
export const GUN_IZI_OLD_IMAGE = "/media/2026/10/aa68bff401285d665ec1f114d2e1eb67.png";
export const GUN_IZI_NEW_IMAGE = "/yayin-akisi/gun-izi-saydam.webp";
const migrationKey = "_gun_izi_photo_v1";

function updatedSchedule(value) {
  let schedule;
  try { schedule = JSON.parse(value); } catch { return null; }
  if (!Array.isArray(schedule)) return null;
  let changed = false;
  const rows = schedule.map((row) => {
    if (row?.time !== "15:00" || row.title !== "Gün İzi"
      || row.host !== "Evren Özalkuş-Sorel Dağıstanlı" || row.image !== GUN_IZI_OLD_IMAGE) return row;
    changed = true;
    return { ...row, image: GUN_IZI_NEW_IMAGE };
  });
  return changed ? JSON.stringify(rows) : null;
}

export function migrateGunIziPhoto(db) {
  return db.transaction(() => {
    const now = Date.now();
    const marker = db.prepare("INSERT INTO site_settings(key,value,updated_at,updated_by) VALUES(?,?,?,'Sistem') ON CONFLICT(key) DO NOTHING")
      .run(migrationKey, "1", now);
    if (!marker.changes) return false;
    const current = db.prepare("SELECT value FROM site_settings WHERE key='broadcastSchedule'").get();
    const next = current && updatedSchedule(current.value);
    if (!next) return false;
    const result = db.prepare("UPDATE site_settings SET value=?,updated_at=?,updated_by='Sistem' WHERE key='broadcastSchedule' AND value=?")
      .run(next, now, current.value);
    if (!result.changes) return false;
    db.prepare("INSERT INTO audit_logs(entity_type,entity_id,action,actor,detail,created_at) VALUES('site_settings',0,'update','Sistem',?,?)")
      .run(JSON.stringify({ key: "broadcastSchedule", program: "Gün İzi", from: GUN_IZI_OLD_IMAGE, to: GUN_IZI_NEW_IMAGE }), now);
    return true;
  })();
}
