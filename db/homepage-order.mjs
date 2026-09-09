export const HOMEPAGE_ORDER_REPAIR_KEY = "_homepage_slider_order_v2";

const visibleStatuses = ["published", "scheduled"];

export function promoteHomepageArticle(db, articleId, placement) {
  if (!articleId || placement === "latest") return false;
  const article = db.prepare("SELECT id FROM articles WHERE id=?").get(articleId);
  if (!article) return false;

  db.prepare(`UPDATE articles
    SET homepage_order=CASE WHEN homepage_order<999 THEN homepage_order+1 ELSE 999 END
    WHERE homepage_placement=? AND status IN ('published','scheduled') AND id<>?`)
    .run(placement, articleId);
  db.prepare("UPDATE articles SET homepage_order=1 WHERE id=?").run(articleId);
  return true;
}

export function repairUnrankedSliderArticles(db) {
  if (db.prepare("SELECT 1 FROM site_settings WHERE key=?").get(HOMEPAGE_ORDER_REPAIR_KEY)) return 0;

  const articles = db.prepare(`SELECT id FROM articles
    WHERE homepage_placement='slider' AND status IN ('published','scheduled') AND homepage_order>=100
    ORDER BY updated_at ASC,id ASC`).all();
  const now = Date.now();

  db.transaction(() => {
    for (const article of articles) promoteHomepageArticle(db, Number(article.id), "slider");
    db.prepare("INSERT INTO site_settings (key,value,updated_at,updated_by) VALUES (?,?,?,'Sistem')")
      .run(HOMEPAGE_ORDER_REPAIR_KEY, String(articles.length), now);
  })();

  return articles.length;
}

export function isVisibleHomepageStatus(status) {
  return visibleStatuses.includes(String(status));
}
