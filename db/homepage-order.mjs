export const HOMEPAGE_ORDER_REPAIR_KEY = "_homepage_slider_order_v2";
export const homepagePlacementLimits = Object.freeze({ slider: 5, side: 2, below: 4 });

const visibleStatuses = ["published", "scheduled"];
const managedPlacements = Object.keys(homepagePlacementLimits);

export function validateHomepageLayout(input) {
  const errors = {};
  const value = { slider: [], side: [], below: [] };
  const seen = new Set();

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { valid: false, value, errors: { layout: "Ana sayfa düzeni geçerli değil." } };
  }

  for (const placement of managedPlacements) {
    const raw = input[placement];
    if (!Array.isArray(raw)) {
      errors[placement] = "Bu alan haber listesi olmalıdır.";
      continue;
    }
    if (raw.length > homepagePlacementLimits[placement]) {
      errors[placement] = `Bu alanda en fazla ${homepagePlacementLimits[placement]} haber olabilir.`;
    }
    for (const candidate of raw) {
      const id = Number(candidate);
      if (!Number.isSafeInteger(id) || id <= 0) {
        errors[placement] = "Geçersiz haber kaydı bulundu.";
        continue;
      }
      if (seen.has(id)) {
        errors.layout = "Bir haber aynı anda yalnızca bir ana sayfa alanında olabilir.";
        continue;
      }
      seen.add(id);
      value[placement].push(id);
    }
  }

  return { valid: Object.keys(errors).length === 0, value, errors };
}

export function normalizeHomepagePlacementLimits(db, now = Date.now()) {
  const movedToLatest = [];
  const updateVisible = db.prepare("UPDATE articles SET homepage_order=?,is_featured=?,updated_at=? WHERE id=?");
  const updateOverflow = db.prepare("UPDATE articles SET homepage_placement='latest',homepage_order=100,is_featured=0,updated_at=? WHERE id=?");

  for (const placement of managedPlacements) {
    const rows = db.prepare(`SELECT id,homepage_order,is_featured FROM articles
      WHERE status='published' AND homepage_placement=?
      ORDER BY homepage_order ASC,COALESCE(published_at,updated_at) DESC,id DESC`).all(placement);
    rows.forEach((row, index) => {
      const id = Number(row.id);
      if (index < homepagePlacementLimits[placement]) {
        const expectedFeatured = placement === "slider" ? 1 : 0;
        if (Number(row.homepage_order) !== index + 1 || Number(row.is_featured) !== expectedFeatured) {
          updateVisible.run(index + 1, expectedFeatured, now, id);
        }
      } else {
        updateOverflow.run(now, id);
        movedToLatest.push(id);
      }
    });
  }

  return { movedToLatest };
}

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
