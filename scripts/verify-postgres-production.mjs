import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import pg from "pg";
import { hashPassword } from "../db/auth-model.mjs";

const { Client } = pg;
const databaseUrl = process.env.KOZA_DATABASE_URL || "";
const baseUrl = new URL(process.env.KOZA_VERIFY_BASE_URL || "http://127.0.0.1:8301");
const databaseName = (() => {
  try { return decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, "")); }
  catch { return ""; }
})();

if (process.env.KOZA_ALLOW_DESTRUCTIVE_VERIFY !== "1") throw new Error("Tam PostgreSQL doğrulaması için KOZA_ALLOW_DESTRUCTIVE_VERIFY=1 zorunludur.");
if (!/^kozatv_verify_[a-z0-9_]+$/.test(databaseName)) throw new Error("Canlı veritabanı reddedildi: " + (databaseName || "tanımsız") + ". Yalnız kozatv_verify_* kopyalarında çalışır.");
if (!databaseUrl) throw new Error("KOZA_DATABASE_URL tanımlanmalıdır.");
if (!["127.0.0.1", "localhost"].includes(baseUrl.hostname)) throw new Error("Tam doğrulama yalnız yerel uygulama adresinde çalışır.");

const suffix = randomBytes(6).toString("hex");
const startedAt = Date.now();
const client = new Client({ connectionString: databaseUrl, application_name: "kozatv-production-verifier" });
const results = [];

function record(name, detail = "ok") { results.push({ name, detail }); }
async function request(path, options = {}) { return fetch(new URL(path, baseUrl), { redirect: "manual", ...options }); }
async function json(response) { const body = await response.json().catch(() => ({})); return { response, body }; }
function cookieFrom(response) { return String(response.headers.get("set-cookie") || "").split(";")[0]; }
async function expectStatus(name, responsePromise, expected) {
  const response = await responsePromise;
  if (response.status !== expected) {
    const body = await response.text();
    assert.equal(response.status, expected, name + ": HTTP " + response.status + ", beklenen " + expected + "; " + body);
  }
  record(name, "HTTP " + response.status);
  return response;
}

async function insertUser(role, label, password) {
  const email = label + "-" + suffix + "@kozatv.invalid";
  await client.query(
    "INSERT INTO admin_users (email,full_name,password_hash,role,active,must_change_password,failed_attempts,locked_until,last_login_at,created_at,updated_at) " +
      "VALUES ($1,$2,$3,$4,1,0,0,NULL,NULL,$5,$5)",
    [email, "PostgreSQL " + label + " " + suffix, hashPassword(password), role, startedAt],
  );
  return email;
}

async function login(email, password) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  assert.equal(response.status, 200, "Giriş başarısız: " + email + " HTTP " + response.status);
  const cookie = cookieFrom(response);
  assert.match(cookie, /^koza_admin_session=/);
  return cookie;
}

await client.connect();
try {
  const adminPassword = "Qa1!" + randomBytes(24).toString("hex");
  const publisherPassword = "Qp1!" + randomBytes(24).toString("hex");
  const viewerPassword = "Qv1!" + randomBytes(24).toString("hex");
  const lockPassword = "Ql1!" + randomBytes(24).toString("hex");
  const adminEmail = await insertUser("admin", "admin", adminPassword);
  const publisherEmail = await insertUser("publisher", "publisher", publisherPassword);
  const viewerEmail = await insertUser("viewer", "viewer", viewerPassword);
  const lockEmail = await insertUser("viewer", "lock", lockPassword);

  const adminCookie = await login(adminEmail, adminPassword);
  const publisherCookie = await login(publisherEmail, publisherPassword);
  const viewerCookie = await login(viewerEmail, viewerPassword);
  record("admin/publisher/viewer login and session cookie");

  await expectStatus("admin panel authenticated", request("/admin", { headers: { cookie: adminCookie } }), 200);
  await expectStatus("anonymous article write blocked", request("/api/articles", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), 401);
  await expectStatus("viewer article list allowed", request("/api/articles?limit=2", { headers: { cookie: viewerCookie } }), 200);
  await expectStatus("viewer article write blocked", request("/api/articles", { method: "POST", headers: { cookie: viewerCookie, "content-type": "application/json" }, body: "{}" }), 403);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    await expectStatus("failed login " + (attempt + 1) + "/5", request("/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: lockEmail, password: "yanlis-parola" }),
    }), 401);
  }
  await expectStatus("locked account rejects correct password", request("/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: lockEmail, password: lockPassword }),
  }), 401);
  const lockRow = await client.query("SELECT locked_until FROM admin_users WHERE email=$1", [lockEmail]);
  assert.ok(Number(lockRow.rows[0].locked_until) > Date.now());
  record("five-failure account lock", "15 minute lock present");

  const categoryResult = await json(await request("/api/categories", {
    method: "POST", headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ name: "PG Doğrulama " + suffix, description: "İzole PostgreSQL üretim doğrulama kategorisi.", color: "#227755", navOrder: 987, isVisible: 1 }),
  }));
  assert.equal(categoryResult.response.status, 201, JSON.stringify(categoryResult.body));
  const category = categoryResult.body.category;
  assert.ok(category?.id && category?.slug);
  record("category create", "id=" + category.id);
  await expectStatus("case-insensitive duplicate category conflict", request("/api/categories", {
    method: "POST", headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ name: category.name.toLocaleLowerCase("tr-TR") }),
  }), 409);
  await expectStatus("publisher category update allowed", request("/api/categories", {
    method: "PATCH", headers: { cookie: publisherCookie, "content-type": "application/json" },
    body: JSON.stringify({ ...category, description: "Yayın yönetmeni PostgreSQL güncelleme doğrulaması." }),
  }), 200);
  await expectStatus("viewer category write blocked", request("/api/categories", {
    method: "POST", headers: { cookie: viewerCookie, "content-type": "application/json" }, body: JSON.stringify({ name: "Yetkisiz " + suffix }),
  }), 403);

  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64");
  const mediaForm = new FormData();
  mediaForm.set("file", new Blob([png], { type: "image/png" }), "postgres-" + suffix + ".png");
  mediaForm.set("altText", "PostgreSQL doğrulama görseli " + suffix);
  mediaForm.set("credit", "Koza TV QA");
  const mediaResult = await json(await request("/api/media", { method: "POST", headers: { cookie: adminCookie }, body: mediaForm }));
  assert.equal(mediaResult.response.status, 201, JSON.stringify(mediaResult.body));
  const media = mediaResult.body.media;
  assert.ok(media?.id && /^\/media\//.test(media?.publicUrl));
  await expectStatus("uploaded media served", request(media.publicUrl), 200);
  record("media upload, metadata and delivery", "id=" + media.id);
  const invalidMedia = new FormData();
  invalidMedia.set("file", new Blob([Buffer.from("not-an-image")], { type: "image/png" }), "fake.png");
  await expectStatus("forged image rejected", request("/api/media", { method: "POST", headers: { cookie: adminCookie }, body: invalidMedia }), 400);

  const articlePayload = {
    slug: "", title: "PostgreSQL tam üretim doğrulama haberi " + suffix,
    spot: "Bu haber, yeni PostgreSQL altyapısındaki yönetim ve yayın akışını uçtan uca doğrulamak için oluşturulmuştur.",
    body: "Bu içerik izole bir üretim veritabanı kopyasında taslak olarak kaydedilir. Editoryal onay adımlarından geçer ve ziyaretçi sayfasında doğrulanır.",
    category: category.name, status: "draft", heroImage: media.publicUrl, imageAlt: "PostgreSQL doğrulama görseli " + suffix,
    videoUrl: "", author: "Koza TV QA", sourceName: "Koza TV", sourceUrl: "", seoTitle: "", seoDescription: "",
    isBreaking: 0, isFeatured: 0, isHomepageGallery: 0, homepagePlacement: "latest", headlinePosition: "left-bottom",
  };
  await expectStatus("publisher direct publish blocked", request("/api/articles", {
    method: "POST", headers: { cookie: publisherCookie, "content-type": "application/json" },
    body: JSON.stringify({ ...articlePayload, title: articlePayload.title + " yetkisiz", status: "published" }),
  }), 403);
  const articleResult = await json(await request("/api/articles", {
    method: "POST", headers: { cookie: adminCookie, "content-type": "application/json" }, body: JSON.stringify(articlePayload),
  }));
  assert.equal(articleResult.response.status, 201, JSON.stringify(articleResult.body));
  let article = articleResult.body.article;
  assert.ok(article?.id && article?.slug);
  record("article draft create", "id=" + article.id);
  await expectStatus("draft hidden from public", request("/haber/" + article.slug), 404);
  for (const action of ["submit_review", "approve", "publish"]) {
    const transition = await json(await request("/api/editorial", {
      method: "POST", headers: { cookie: adminCookie, "content-type": "application/json" },
      body: JSON.stringify({ type: "workflow", articleId: article.id, action }),
    }));
    assert.equal(transition.response.status, 200, action + ": " + JSON.stringify(transition.body));
    article = transition.body.article;
    record("workflow " + action, article.workflowState);
  }
  assert.equal(article.status, "published");
  const publicArticle = await expectStatus("published article visible", request("/haber/" + article.slug), 200);
  assert.match(await publicArticle.text(), new RegExp(suffix));
  await expectStatus("editorial comment create", request("/api/editorial", {
    method: "POST", headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ type: "comment", articleId: article.id, note: "PostgreSQL üretim doğrulaması tamamlandı." }),
  }), 201);
  await expectStatus("editorial timeline read", request("/api/editorial?articleId=" + article.id, { headers: { cookie: adminCookie } }), 200);
  const searchPage = await expectStatus("published article search", request("/arama?q=" + encodeURIComponent(suffix)), 200);
  assert.match(await searchPage.text(), new RegExp(suffix));

  const adResult = await json(await request("/api/ads", {
    method: "POST", headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ placement: "section_inline", advertiser: "Koza TV QA", campaignName: "PG " + suffix, title: "PostgreSQL reklam testi " + suffix, targetUrl: "/canli", ctaLabel: "İzle", kind: "house", theme: "dark", priority: 999, active: 0 }),
  }));
  assert.equal(adResult.response.status, 201, JSON.stringify(adResult.body));
  const advertisement = adResult.body.advertisement;
  await expectStatus("advertisement optimistic update", request("/api/ads", {
    method: "PATCH", headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ ...advertisement, title: "PostgreSQL reklam güncelleme " + suffix }),
  }), 200);
  await expectStatus("viewer ad inventory blocked", request("/api/ads", { headers: { cookie: viewerCookie } }), 403);

  const motto = "PostgreSQL doğrulama " + suffix;
  const settingsResult = await json(await request("/api/settings", {
    method: "PATCH", headers: { cookie: adminCookie, "content-type": "application/json" }, body: JSON.stringify({ siteMotto: motto }),
  }));
  assert.equal(settingsResult.response.status, 200, JSON.stringify(settingsResult.body));
  assert.equal(settingsResult.body.settings.siteMotto, motto);
  await expectStatus("viewer settings write blocked", request("/api/settings", {
    method: "PATCH", headers: { cookie: viewerCookie, "content-type": "application/json" }, body: JSON.stringify({ siteMotto: "Yetkisiz" }),
  }), 403);
  record("site settings write and role boundary");

  const userEmail = "api-user-" + suffix + "@kozatv.invalid";
  const userResult = await json(await request("/api/users", {
    method: "POST", headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ fullName: "API Kullanıcısı " + suffix, email: userEmail, role: "reporter", password: "Koza!" + suffix + "2026" }),
  }));
  assert.equal(userResult.response.status, 201, JSON.stringify(userResult.body));
  await expectStatus("user role update", request("/api/users", {
    method: "PATCH", headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ id: userResult.body.user.id, role: "editor" }),
  }), 200);
  await expectStatus("non-admin user administration blocked", request("/api/users", { headers: { cookie: publisherCookie } }), 403);

  const counts = await client.query(
    "SELECT " +
      "(SELECT count(*) FROM articles WHERE title LIKE $1) AS articles, " +
      "(SELECT count(*) FROM media_assets WHERE original_name=$2) AS media, " +
      "(SELECT count(*) FROM article_revisions WHERE article_id=$3) AS revisions, " +
      "(SELECT count(*) FROM workflow_events WHERE article_id=$3) AS events, " +
      "(SELECT count(*) FROM article_comments WHERE article_id=$3) AS comments, " +
      "(SELECT count(*) FROM audit_logs WHERE created_at >= $4) AS audits",
    ["%" + suffix + "%", "postgres-" + suffix + ".png", article.id, startedAt],
  );
  const integrity = Object.fromEntries(Object.entries(counts.rows[0]).map(([key, value]) => [key, Number(value)]));
  assert.equal(integrity.articles, 1);
  assert.equal(integrity.media, 1);
  assert.ok(integrity.revisions >= 1 && integrity.events >= 3 && integrity.comments >= 1 && integrity.audits >= 5);
  record("PostgreSQL relational persistence", JSON.stringify(integrity));

  console.log(JSON.stringify({ ok: true, database: databaseName, checks: results.length, results }, null, 2));
} finally {
  await client.end();
}
