import { moveHomepageArticlesToLatest } from "./homepage-latest.mjs";

export const HOMEPAGE_ORDER_REPAIR_KEY = "_homepage_slider_order_v2";
export const homepagePlacementLimits = Object.freeze({ slider: 5, side: 2, below: 4 });

const visibleStatuses = ["published", "scheduled"];
const managedPlacements = Object.keys(homepagePlacementLimits);

export function validateHomepageLayout(input) {
  const errors = {};
  const value = { slider: [], side: [], below: [], latest: [] };
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

  // The preview supplies arrival order, not permission to reorder existing latest records.
  if (input.latest !== undefined) {
    if (!Array.isArray(input.latest) || input.latest.length > 60) {
      errors.latest = "Son Haberler listesi en fazla 60 haber içermelidir.";
    } else {
      for (const candidate of input.latest) {
        const id = Number(candidate);
        if (!Number.isSafeInteger(id) || id <= 0 || seen.has(id)) {
          errors.latest = "Son Haberler listesinde geçersiz veya tekrarlanan haber var.";
          continue;
        }
        seen.add(id);
        value.latest.push(id);
      }
    }
  }

  return { valid: Object.keys(errors).length === 0, value, errors };
}

export function normalizeHomepagePlacementLimits(db, now = Date.now()) {
  return db.transaction(() => {
    const movedToLatest = [];
    const updateVisible = db.prepare("UPDATE articles SET homepage_order=?,is_featured=?,updated_at=? WHERE id=?");

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
          movedToLatest.push(id);
        }
      });
    }

    return { movedToLatest: moveHomepageArticlesToLatest(db, movedToLatest, now) };
  })();
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

// The legacy-homepage bridge must use the same overflow queue as the editors.
export function syncLegacyHomepagePlacements(db, urls, now = Date.now()) {
  const ordered = [...new Set(urls)].slice(0, 50);
  return db.transaction(() => {
    const before = db.prepare("SELECT id,source_url AS url FROM articles WHERE source_name='kozatv.com.tr' AND status='published' AND homepage_placement IN ('slider','side','below') ORDER BY homepage_placement,homepage_order,id").all();
    const desiredSlider = new Set(ordered.slice(0, 5));
    moveHomepageArticlesToLatest(db, before.filter((article) => !desiredSlider.has(article.url)).map((article) => article.id), now);
    db.prepare("UPDATE articles SET is_featured=0,is_breaking=0,homepage_order=500 WHERE source_name='kozatv.com.tr' AND homepage_placement='latest'").run();
    const update = db.prepare("UPDATE articles SET is_featured=?,is_breaking=?,homepage_order=?,homepage_placement=?,updated_at=? WHERE source_name='kozatv.com.tr' AND source_url=? AND status='published'");
    let matched = 0;
    ordered.forEach((url, index) => {
      matched += update.run(index < 5 ? 1 : 0, index === 0 ? 1 : 0, index + 1, index < 5 ? "slider" : "latest", now, url).changes;
    });
    normalizeHomepagePlacementLimits(db, now);
    return matched;
  })();
}
