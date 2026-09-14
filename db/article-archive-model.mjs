export function archiveSearchText(value) {
  return String(value ?? "").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/\p{M}/gu, "").replace(/ı/g, "i");
}
export function articleArchiveFilter(options = {}) {
  const where = [];
  const params = [];
  if (options.status) { where.push("a.status=?"); params.push(options.status); }
  if (options.category) { where.push("a.category=?"); params.push(options.category); }
  if (options.assignedTo) { where.push("a.assigned_to=?"); params.push(options.assignedTo); }
  const search = archiveSearchText(String(options.search ?? "").trim().slice(0, 120));
  if (search) {
    const fields = ["title", "spot", "slug", "author", "source_name", "created_by", "updated_by"];
    where.push(`(${fields.map(field => `instr(koza_search_text(a.${field}),?)>0`).join(" OR ")})`);
    params.push(...fields.map(() => search));
  }
  return { sql: where.length ? `WHERE ${where.join(" AND ")}` : "", params };
}

/* Eski kayıtlarda yalnız bulunan geçmiş kanıtı kullanılır; imza, editörü tahmin etmek için kullanılmaz. */
export function backfillArticleActors(db) {
  db.exec(`UPDATE articles SET created_by=COALESCE((SELECT actor_name FROM article_revisions r WHERE r.article_id=articles.id AND r.version=1 AND r.reason='save' ORDER BY r.id LIMIT 1),'') WHERE created_by='';
    UPDATE articles SET updated_by=COALESCE((SELECT actor FROM (
      SELECT article_id AS aid,actor_name AS actor,created_at,2 AS priority,id FROM article_revisions
      UNION ALL SELECT article_id,actor_name,created_at,1,id FROM workflow_events WHERE action IN ('assign','correction','submit_review','request_changes','approve','reject','publish','withdraw','reopen')
      UNION ALL SELECT entity_id,actor,created_at,3,id FROM audit_logs WHERE entity_type='article' AND action IN ('save','publish','assign','correction','submit_review','request_changes','approve','reject','withdraw','reopen','agency_update','agency_import')
    ) WHERE aid=articles.id AND TRIM(actor)<>'' ORDER BY created_at DESC,priority DESC,id DESC LIMIT 1),updated_by)`);
}
