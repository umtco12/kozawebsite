// Son Haberler has its own arrival order. Publication dates remain editorial data.
export const homepageLatestOrderSql = "COALESCE(homepage_latest_at,published_at,updated_at) DESC,id DESC";

export function ensureHomepageLatestSchema(db) {
  if (!db.prepare("PRAGMA table_info(articles)").all().some((column) => column.name === "homepage_latest_at")) {
    db.exec("ALTER TABLE articles ADD COLUMN homepage_latest_at INTEGER");
  }
  // Existing latest records retain their publication order until they enter again.
  db.exec(`CREATE INDEX IF NOT EXISTS idx_articles_homepage_latest
    ON articles(status,homepage_placement,COALESCE(homepage_latest_at,published_at,updated_at) DESC,id DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_homepage_latest_clock ON articles(homepage_latest_at DESC)`);
}

// IDs are in display order (newest arrival first). The persisted logical clock
// keeps successive drops ordered even within one millisecond or after a restart.
export function recordHomepageLatestEntries(db, articleIds, now = Date.now()) {
  if (!articleIds.length) return;
  const last = db.prepare("SELECT MAX(homepage_latest_at) AS value FROM articles").get();
  const firstTime = Math.max(now, Number(last.value || 0) + 1);
  const update = db.prepare("UPDATE articles SET homepage_latest_at=? WHERE id=? AND status='published' AND homepage_placement='latest'");
  [...new Set(articleIds)].forEach((id, index, ids) => update.run(firstTime + ids.length - index - 1, id));
}

export function moveHomepageArticlesToLatest(db, articleIds, now = Date.now(), actor = "Sistem") {
  return db.transaction(() => {
    const moved = [];
    const get = db.prepare("SELECT homepage_placement AS placement,homepage_order AS position FROM articles WHERE id=? AND status='published' AND homepage_placement IN ('slider','side','below')");
    const update = db.prepare("UPDATE articles SET homepage_placement='latest',homepage_order=100,is_featured=0,edit_version=edit_version+1,updated_at=? WHERE id=?");
    const audit = db.prepare("INSERT INTO audit_logs (entity_type,entity_id,action,actor,detail,created_at) VALUES ('article',?,'homepage_to_latest',?,?,?)");
    for (const id of new Set(articleIds)) {
      const before = get.get(id);
      if (!before) continue;
      update.run(now, id);
      audit.run(id, actor, JSON.stringify({ from: before, to: "latest" }), now);
      moved.push(id);
    }
    recordHomepageLatestEntries(db, moved, now);
    return moved;
  })();
}
