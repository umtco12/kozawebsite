import { randomBytes } from "node:crypto";
import pg from "pg";
import { hashPassword } from "../db/auth-model.mjs";

const { Client } = pg;
const databaseUrl = process.env.KOZA_DATABASE_URL || "";
const baseUrl = process.env.KOZA_SMOKE_BASE_URL || "http://127.0.0.1:8201";
const parsedBaseUrl = new URL(baseUrl);

if (process.env.KOZA_ALLOW_WRITE_SMOKE !== "1") throw new Error("Yazma smoke testi için KOZA_ALLOW_WRITE_SMOKE=1 zorunludur.");
if (!databaseUrl) throw new Error("KOZA_DATABASE_URL tanımlanmalıdır.");
if (!["127.0.0.1", "localhost"].includes(parsedBaseUrl.hostname)) throw new Error("Yazma smoke testi yalnız yerel uygulama adresinde çalışır.");

const suffix = randomBytes(8).toString("hex");
const email = `pg-qa-${suffix}@kozatv.invalid`;
const actor = `PostgreSQL QA ${suffix}`;
const password = `Qa1!${randomBytes(24).toString("hex")}`;
const fromPath = `/postgresql-qa-${suffix}`;
const articleTitle = "PostgreSQL canlı yazma smoke haberi " + suffix;
const startedAt = Date.now();
const client = new Client({ connectionString: databaseUrl, application_name: "kozatv-postgres-smoke" });
let redirectId = null;
let articleId = null;

async function request(path, options = {}) {
  return fetch(new URL(path, parsedBaseUrl), { redirect: "manual", ...options });
}

await client.connect();
try {
  await client.query(
    `INSERT INTO admin_users (email,full_name,password_hash,role,active,must_change_password,failed_attempts,locked_until,last_login_at,created_at,updated_at)
     VALUES ($1,$2,$3,'admin',1,0,0,NULL,NULL,$4,$4)`,
    [email, actor, hashPassword(password), startedAt],
  );

  const login = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (login.status !== 200) throw new Error(`PostgreSQL giriş smoke testi başarısız: HTTP ${login.status}`);
  const cookie = String(login.headers.get("set-cookie") || "").split(";")[0];
  if (!cookie.startsWith("koza_admin_session=")) throw new Error("PostgreSQL giriş smoke testi oturum çerezi üretmedi.");

  const me = await request("/api/auth/me", { headers: { cookie } });
  if (me.status !== 200) throw new Error(`PostgreSQL oturum smoke testi başarısız: HTTP ${me.status}`);
  const admin = await request("/admin", { headers: { cookie } });
  const articleCreate = await request("/api/articles", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({
      slug: "",
      title: articleTitle,
      spot: "Bu geçici taslak, canlı PostgreSQL haber yazma yolunun güvenli biçimde çalıştığını doğrular.",
      body: "Bu kayıt yalnız üretim smoke testi için oluşturulur. Ziyaretçiye açılmaz ve test sonunda ilişkili revizyonlarla birlikte tamamen silinir.",
      category: "Gündem",
      status: "draft",
      heroImage: "/news/gorsel-yok.svg",
      imageAlt: "PostgreSQL canlı yazma smoke testi",
      author: actor,
      sourceName: "Koza TV",
      homepagePlacement: "latest",
      headlinePosition: "left-bottom",
    }),
  });
  const articleBody = await articleCreate.json();
  if (articleCreate.status !== 201 || !articleBody.article?.id) throw new Error("PostgreSQL haber yazma smoke testi başarısız: HTTP " + articleCreate.status);
  articleId = Number(articleBody.article.id);
  const hiddenDraft = await request("/haber/" + articleBody.article.slug);
  if (hiddenDraft.status !== 404) throw new Error("PostgreSQL taslak gizlilik smoke testi başarısız: HTTP " + hiddenDraft.status);
  if (admin.status !== 200) throw new Error(`PostgreSQL admin smoke testi başarısız: HTTP ${admin.status}`);

  const create = await request("/api/redirects", {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ fromPath, toPath: "/canli", kind: "temporary", note: "PostgreSQL geçiş testi" }),
  });
  const created = await create.json();
  if (create.status !== 201 || !created.redirect?.id) throw new Error(`PostgreSQL yazma smoke testi başarısız: HTTP ${create.status}`);
  redirectId = Number(created.redirect.id);

  const remove = await request(`/api/redirects?id=${redirectId}`, { method: "DELETE", headers: { cookie } });
  if (remove.status !== 200) throw new Error(`PostgreSQL silme smoke testi başarısız: HTTP ${remove.status}`);
  redirectId = null;

  console.log(JSON.stringify({ ok: true, login: login.status, session: me.status, admin: admin.status, articleCreate: articleCreate.status, hiddenDraft: hiddenDraft.status, create: create.status, remove: remove.status }));
} finally {
  if (redirectId) await client.query("DELETE FROM redirects WHERE id=$1 AND from_path=$2", [redirectId, fromPath]).catch(() => undefined);
  await client.query("DELETE FROM redirects WHERE from_path=$1", [fromPath]).catch(() => undefined);
  if (articleId) await client.query("DELETE FROM articles WHERE id=$1 AND title=$2", [articleId, articleTitle]).catch(() => undefined);
  await client.query("DELETE FROM audit_logs WHERE actor=$1 AND created_at>=$2", [actor, startedAt]).catch(() => undefined);
  await client.query("DELETE FROM admin_users WHERE email=$1", [email]).catch(() => undefined);
  await client.end();
}
