import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test, { after, before } from "node:test";
import {
  defaultContent,
  isValidContentUpdate,
  mergeContentRows,
} from "../app/api/content/content-model.mjs";
import { slugify, validateArticleInput } from "../db/article-model.mjs";
import { hashPassword, validatePassword, verifyPassword } from "../db/auth-model.mjs";

const projectRoot = new URL("../", import.meta.url);
const execFileAsync = promisify(execFile);
process.env.KOZA_DB_PATH = join(
  tmpdir(),
  `koza-content-test-${process.pid}-${Date.now()}.sqlite`,
);
process.env.KOZA_MEDIA_PATH = join(
  tmpdir(),
  `koza-media-test-${process.pid}-${Date.now()}`,
);
process.env.KOZA_MEDIA_QUOTA_BYTES = "100";
process.env.KOZA_BOOTSTRAP_ADMIN_EMAIL = "admin@koza.test";
process.env.KOZA_BOOTSTRAP_ADMIN_PASSWORD = "Koza!Test2026Secure";
process.env.KOZA_BOOTSTRAP_ADMIN_NAME = "Koza Test Yöneticisi";
process.env.KOZA_BOOTSTRAP_ADMIN_FORCE_CHANGE = "0";
const port = 32000 + (process.pid % 10000);
const baseUrl = `http://127.0.0.1:${port}`;
let productionServer;
let adminCookie = "";

before(async () => {
  productionServer = spawn(
    process.execPath,
    [new URL("../dist/standalone/server.js", import.meta.url).pathname],
    {
      cwd: new URL("../dist/standalone/", import.meta.url),
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let lastError;
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) {
        const login = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.KOZA_BOOTSTRAP_ADMIN_EMAIL, password: process.env.KOZA_BOOTSTRAP_ADMIN_PASSWORD }) });
        assert.equal(login.status, 200);
        adminCookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
        assert.ok(adminCookie.startsWith("koza_admin_session="));
        return;
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Üretim sunucusu başlamadı: ${lastError}`);
});

after(() => {
  productionServer?.kill("SIGTERM");
});

function request(path, init = {}) {
  const headers = new Headers(init.headers);
  if (adminCookie && !headers.has("cookie")) headers.set("cookie", adminCookie);
  return fetch(`${baseUrl}${path}`, { ...init, headers });
}

function anonymousRequest(path, init = {}) { return fetch(`${baseUrl}${path}`, init); }

async function html(path) {
  const response = await request(path, {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200, `${path} 200 dönmeli`);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
    `${path} HTML dönmeli`,
  );
  return response.text();
}

test("ana sayfa Koza TV haber deneyimini sunar", async () => {
  const body = await html("/");

  assert.match(body, /<html lang="tr">/i);
  assert.match(body, /<title>Koza TV \| Konuşma Zamanı<\/title>/i);
  assert.match(body, /SON DAKİKA/);
  assert.match(body, /Günün Akışı/);
  assert.match(body, /Öne Çıkanlar/);
  assert.match(body, /KÖŞE/);
  assert.match(body, /Gündem/);
  assert.match(body, /Koza TV Ana Haber/);
  assert.match(body, /href="\/haber\/turkiyenin-gundemi-koza-tv-haber-merkezinde"/);
  assert.match(body, /href="\/canli"/);
  assert.match(body, /href="\/yazarlar"/);
  assert.match(body, /href="\/kategori\/ekonomi"/);
  assert.doesNotMatch(body, /Your site is taking shape|Building your site/i);
});

test("ana sayfanın SEO ve sosyal paylaşım etiketleri doğrudur", async () => {
  const body = await html("/");

  assert.match(
    body,
    /<meta name="description" content="Türkiye ve dünyadan son dakika haberleri[^>]+>/i,
  );
  assert.match(body, /property="og:site_name" content="Koza TV"/i);
  assert.match(body, /property="og:locale" content="tr_TR"/i);
  assert.match(
    body,
    /property="og:image" content="https:\/\/www\.kozatv\.com\.tr\/og-v2\.png"/i,
  );
  assert.match(body, /name="twitter:card" content="summary_large_image"/i);
  assert.match(
    body,
    /name="twitter:image" content="https:\/\/www\.kozatv\.com\.tr\/og-v2\.png"/i,
  );
});

test("canlı yayın sayfası yayın bilgileri ve erişilebilir oynatma kontrolü içerir", async () => {
  const body = await html("/canli");

  assert.match(body, /Koza TV Canlı Yayın/);
  assert.match(body, /aria-label="Canlı yayını başlat"/);
  assert.match(body, /Türksat 3A/);
  assert.match(body, /Digitürk 614/);
  assert.match(body, /href="\/"/);
});

test("yazarlar sayfası yazar listesini ve ana sayfa dönüşünü sunar", async () => {
  const body = await html("/yazarlar");

  assert.match(body, /Köşe Yazarları/);
  assert.match(body, /Mehmet Ali Güller/);
  assert.match(body, /Esmehan Güneri/);
  assert.match(body, /Enes Arınç/);
  assert.match(body, /KOZA TV ANA SAYFA/);
});

test("admin içerik merkezinin temel yayın araçları görünür", async () => {
  const body = await html("/admin");

  assert.match(body, /İÇERİK MERKEZİ/);
  assert.match(body, /Haber Masası/);
  assert.match(body, /Tüm Haberler/);
  assert.match(body, /Yeni Haber/);
  assert.match(body, /Kaynak Merkezi/);
  assert.match(body, /Kategoriler/);
  assert.match(body, /Medya Kütüphanesi/);
  assert.match(body, /AI HABER MASASI/);
  assert.match(body, /Koza Test Yöneticisi/);
  assert.match(body, /Kullanıcılar/);
  assert.match(body, /Yayın Stüdyosu/);
});

test("admin girişi güvenli oturum çerezi üretir ve yetkisiz sayfayı yönlendirir", async () => {
  const blocked = await anonymousRequest("/admin", { redirect: "manual" });
  assert.ok([302, 303, 307, 308].includes(blocked.status));
  assert.equal(blocked.headers.get("location"), "/admin/giris");
  const loginPage = await anonymousRequest("/admin/giris");
  assert.equal(loginPage.status, 200);
  assert.match(await loginPage.text(), /Güvenli giriş yap/);
  const invalid = await anonymousRequest("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "admin@koza.test", password: "yanlis" }) });
  assert.equal(invalid.status, 401);
  const valid = await anonymousRequest("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.KOZA_BOOTSTRAP_ADMIN_EMAIL, password: process.env.KOZA_BOOTSTRAP_ADMIN_PASSWORD }) });
  assert.equal(valid.status, 200);
  const cookie = valid.headers.get("set-cookie") ?? "";
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  const me = await request("/api/auth/me");
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.role, "admin");
});

test("parolalar scrypt ile özetlenir ve güçlü parola kuralı uygulanır", () => {
  assert.match(validatePassword("kisa") ?? "", /12 karakter/);
  assert.match(validatePassword("yalnizcauzunmetin") ?? "", /büyük harf/);
  assert.equal(validatePassword("Koza!Guvenli2026"), null);
  const encoded = hashPassword("Koza!Guvenli2026");
  assert.match(encoded, /^scrypt\$/);
  assert.equal(verifyPassword("Koza!Guvenli2026", encoded), true);
  assert.equal(verifyPassword("Koza!Yanlis2026", encoded), false);
});

test("rol sistemi ilk parola değişimini zorunlu tutar ve viewer yazma işlemini reddeder", async () => {
  const temporaryPassword = "Koza!Viewer2026Temp";
  const nextPassword = "Koza!Viewer2026Kalici";
  const created = await request("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: "Test Görüntüleyici", email: "viewer@koza.test", role: "viewer", password: temporaryPassword }) });
  assert.equal(created.status, 201);
  const login = await anonymousRequest("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "viewer@koza.test", password: temporaryPassword }) });
  assert.equal(login.status, 200);
  const viewerCookie = login.headers.get("set-cookie")?.split(";")[0] ?? "";
  const forced = await anonymousRequest("/api/categories", { method: "POST", headers: { "content-type": "application/json", cookie: viewerCookie }, body: JSON.stringify({ name: "Yetkisiz" }) });
  assert.equal(forced.status, 403);
  assert.equal((await forced.json()).code, "PASSWORD_CHANGE_REQUIRED");
  const changed = await anonymousRequest("/api/auth/password", { method: "POST", headers: { "content-type": "application/json", cookie: viewerCookie }, body: JSON.stringify({ currentPassword: temporaryPassword, nextPassword }) });
  assert.equal(changed.status, 200);
  const relogin = await anonymousRequest("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: "viewer@koza.test", password: nextPassword }) });
  const permanentCookie = relogin.headers.get("set-cookie")?.split(";")[0] ?? "";
  const forbidden = await anonymousRequest("/api/categories", { method: "POST", headers: { "content-type": "application/json", cookie: permanentCookie }, body: JSON.stringify({ name: "Yetkisiz" }) });
  assert.equal(forbidden.status, 403);
});

test("haber modeli Türkçe başlıkları slug'a çevirir ve yayın alanlarını doğrular", () => {
  assert.equal(slugify("İstanbul'da Önemli Gelişme!"), "istanbul-da-onemli-gelisme");
  const valid = validateArticleInput({ title: "Test için yeterince uzun haber başlığı", spot: "Bu test için yeterince açıklayıcı bir haber spotudur.", body: "Bu haber metni doğrulama sınırını geçmek için yeterince uzun hazırlanmıştır. İkinci cümle içerik alanını tamamlar.", category: "Gündem", status: "draft", sourceUrl: "https://example.com/haber" });
  assert.equal(valid.valid, true);
  const invalid = validateArticleInput({ title: "Kısa", spot: "Kısa", body: "Kısa", category: "", status: "published", sourceUrl: "javascript:alert(1)" });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.title);
  assert.ok(invalid.errors.body);
});

test("haber API taslak, inceleme ve yayın akışını SQLite üzerinde kalıcı tutar", async () => {
  const article = {
    slug: "", title: "Koza TV otomatik yayın akışı test haberi", spot: "Editör kontrolündeki yayın akışını doğrulayan ayrıntılı test spotu.",
    body: "Bu içerik önce taslak olarak kaydedilir. Ardından editör tarafından kontrol edilerek yayına alınır. Böylece ziyaretçi sayfası yalnızca onaylanan haberi gösterir.",
    category: "Teknoloji", status: "draft", heroImage: "/news/studio.jpg", imageAlt: "Koza TV test haber masası", videoUrl: "", author: "Test Editörü", sourceName: "Koza TV", sourceUrl: "", seoTitle: "", seoDescription: "", isBreaking: 0, isFeatured: 0,
  };
  const created = await request("/api/articles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(article) });
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.equal(createdBody.article.status, "draft");
  assert.equal(createdBody.article.slug, "koza-tv-otomatik-yayin-akisi-test-haberi");

  const hidden = await html(`/haber/${createdBody.article.slug}`);
  assert.match(hidden, /Haber bulunamadı/);

  const directPublish = await request("/api/articles", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...createdBody.article, status: "published" }) });
  assert.equal(directPublish.status, 409, "Onaysız haber doğrudan yayınlanamamalı");
  for (const action of ["submit_review", "approve", "publish"]) {
    const transition = await request("/api/editorial", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "workflow", articleId: createdBody.article.id, action }) });
    assert.equal(transition.status, 200, `${action} geçişi tamamlanmalı`);
  }
  const published = await request(`/api/articles?limit=100`);
  const publishedBody = { article: (await published.json()).articles.find((item) => item.id === createdBody.article.id) };
  assert.equal(publishedBody.article.status, "published");
  assert.ok(publishedBody.article.publishedAt);

  const publicPage = await html(`/haber/${publishedBody.article.slug}`);
  assert.match(publicPage, /Koza TV otomatik yayın akışı test haberi/);
  assert.match(publicPage, /"@type":"NewsArticle"/);
  assert.match(publicPage, /Test Editörü/);
});

test("profesyonel editoryal akış revizyon, yorum ve işlem geçmişi tutar", async () => {
  const articles = await request("/api/articles?limit=100");
  const article = (await articles.json()).articles[0];
  const comment = await request("/api/editorial", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ type: "comment", articleId: article.id, note: "Kapak görselinin kaynağı doğrulandı." }) });
  assert.equal(comment.status, 201);
  const timeline = await request(`/api/editorial?articleId=${article.id}`);
  assert.equal(timeline.status, 200);
  const data = await timeline.json();
  assert.ok(data.revisions.length >= 1);
  assert.ok(data.comments.some((item) => item.body.includes("kaynağı doğrulandı")));
  assert.ok(Array.isArray(data.events));
  assert.ok(Array.isArray(data.report));
  const blocked = await anonymousRequest("/api/editorial?articleId=1");
  assert.equal(blocked.status, 401);
});

test("haber API geçersiz içerik ve kaynak adreslerini reddeder", async () => {
  const invalidArticle = await request("/api/articles", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Kısa", status: "draft" }) });
  assert.equal(invalidArticle.status, 400);
  const invalidArticleBody = await invalidArticle.json();
  assert.ok(invalidArticleBody.fields.title);

  const invalidSource = await request("/api/sources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Güvensiz", url: "javascript:alert(1)" }) });
  assert.equal(invalidSource.status, 400);
  const source = await request("/api/sources", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Koza Test Kaynağı", url: "https://example.com/koza-feed", type: "rss" }) });
  assert.equal(source.status, 201);
});

test("oturumsuz haber ve kaynak yazma istekleri kapalıdır", async () => {
  const externalHeaders = { "content-type": "application/json", host: "46.225.169.52", "x-forwarded-host": "46.225.169.52" };
  const blockedArticle = await anonymousRequest("/api/articles", { method: "POST", headers: externalHeaders, body: "{}" });
  const blockedSource = await anonymousRequest("/api/sources", { method: "POST", headers: externalHeaders, body: "{}" });
  assert.equal(blockedArticle.status, 401);
  assert.equal(blockedSource.status, 401);
});

test("kategoriler admin API üzerinden oluşturulur, sıralanır ve menüden gizlenir", async () => {
  const initial = await request("/api/categories");
  assert.equal(initial.status, 200);
  const initialBody = await initial.json();
  assert.ok(initialBody.categories.length >= 9);
  assert.equal(initialBody.categories[0].name, "Gündem");

  const created = await request("/api/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Sağlık", description: "Sağlık dünyasından doğrulanmış gelişmeler.", color: "#227755", navOrder: 15, isVisible: 1 }) });
  assert.equal(created.status, 201);
  const createdBody = await created.json();
  assert.equal(createdBody.category.slug, "saglik");

  const visibleHome = await html("/");
  assert.match(visibleHome, /href="\/kategori\/saglik"/);

  const hidden = await request("/api/categories", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...createdBody.category, isVisible: 0 }) });
  assert.equal(hidden.status, 200);
  const hiddenHome = await html("/");
  assert.doesNotMatch(hiddenHome, /href="\/kategori\/saglik"/);
  assert.match(await html("/kategori/saglik"), /Kategori bulunamadı/);

  const duplicate = await request("/api/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Gündem" }) });
  assert.equal(duplicate.status, 409);
  const external = await anonymousRequest("/api/categories", { method: "POST", headers: { "content-type": "application/json", host: "46.225.169.52", "x-forwarded-host": "46.225.169.52" }, body: "{}" });
  assert.equal(external.status, 401);
});

test("görseller kalıcı medya alanına doğrulanarak yüklenir ve yeniden sunulur", async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nksAAAAASUVORK5CYII=", "base64");
  const form = new FormData();
  form.set("file", new Blob([png], { type: "image/png" }), "koza-test.png");
  form.set("altText", "Koza TV test görseli");
  form.set("credit", "Koza TV");
  const uploaded = await request("/api/media", { method: "POST", body: form });
  assert.equal(uploaded.status, 201);
  const uploadedBody = await uploaded.json();
  assert.match(uploadedBody.media.publicUrl, /^\/media\/\d{4}\/\d{2}\/[a-f0-9]{32}\.png$/);
  assert.equal(uploadedBody.media.altText, "Koza TV test görseli");
  const served = await request(uploadedBody.media.publicUrl);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/png");
  assert.deepEqual(Buffer.from(await served.arrayBuffer()), png);

  const invalidForm = new FormData();
  invalidForm.set("file", new Blob(["zararlı içerik"], { type: "image/png" }), "sahte.png");
  const invalid = await request("/api/media", { method: "POST", body: invalidForm });
  assert.equal(invalid.status, 400);
  const library = await request("/api/media");
  const libraryBody = await library.json();
  assert.equal(libraryBody.stats.total, 1);
  assert.equal(libraryBody.stats.totalBytes, png.length);
  assert.equal(libraryBody.stats.quotaBytes, 100);
  const quotaForm = new FormData();
  quotaForm.set("file", new Blob([png], { type: "image/png" }), "ikinci.png");
  const quotaExceeded = await request("/api/media", { method: "POST", body: quotaForm });
  assert.equal(quotaExceeded.status, 507);
  const external = await anonymousRequest("/api/media", { method: "POST", headers: { host: "46.225.169.52", "x-forwarded-host": "46.225.169.52" } });
  assert.equal(external.status, 401);
});

test("haber detay, kategori, sitemap, robots ve RSS keşfedilebilirlik yüzeyleri çalışır", async () => {
  const article = await html("/haber/turkiyenin-gundemi-koza-tv-haber-merkezinde");
  assert.match(article, /property="og:type" content="article"/i);
  assert.match(article, /rel="canonical" href="https:\/\/www\.kozatv\.com\.tr\/haber\/turkiyenin-gundemi-koza-tv-haber-merkezinde"/i);
  assert.match(article, /"@type":"NewsArticle"/);
  assert.match(article, /Koza TV Haber Merkezi/);

  const category = await html("/kategori/gundem");
  assert.match(category, /<h1>Gündem<\/h1>/);
  assert.match(category, /Türkiye'nin gündemi/);

  const sitemap = await request("/sitemap.xml");
  assert.equal(sitemap.status, 200);
  assert.match(await sitemap.text(), /\/haber\/turkiyenin-gundemi-koza-tv-haber-merkezinde/);
  const robots = await request("/robots.txt");
  assert.match(await robots.text(), /Disallow: \/admin/);
  const rss = await request("/rss.xml");
  assert.match(await rss.text(), /<rss version="2.0">/);
});

test("içerik modeli manşet ve yazar varsayılanlarını sağlar", () => {
  assert.equal(defaultContent.leads.length, 3);
  assert.equal(defaultContent.writers.length, 4);
  assert.deepEqual(
    defaultContent.leads.map((lead) => lead.category),
    ["Gündem", "Siyaset", "Dünya"],
  );
  assert.ok(
    defaultContent.leads.every((lead) => lead.image.startsWith("/news/")),
  );
});

test("içerik modeli geçerli ve geçersiz güncelleme yüklerini ayırır", () => {
  assert.equal(isValidContentUpdate({ key: "leads", value: [] }), true);
  assert.equal(isValidContentUpdate({ key: "writers", value: [] }), true);
  assert.equal(isValidContentUpdate({ key: "unknown", value: [] }), false);
  assert.equal(isValidContentUpdate({ key: "leads", value: {} }), false);
  assert.equal(isValidContentUpdate(null), false);
});

test("veritabanı içerikleri yalnızca izin verilen alanlara birleşir", () => {
  const merged = mergeContentRows([
    {
      key: "leads",
      value: JSON.stringify([
        {
          category: "Özel Haber",
          title: "Test manşeti",
          summary: "Test özeti",
          image: "/news/gundem.jpg",
        },
      ]),
    },
    { key: "unauthorized", value: JSON.stringify(["değişmemeli"]) },
  ]);

  assert.equal(merged.leads.length, 1);
  assert.equal(merged.leads[0].title, "Test manşeti");
  assert.deepEqual(merged.writers, defaultContent.writers);
  assert.equal("unauthorized" in merged, false);
});

test("içerik API kalıcı SQLite verisini yazar ve yeniden okur", async () => {
  const update = await request("/api/content", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      key: "writers",
      value: [
        {
          name: "Koza Test Yazarı",
          role: "Yazar",
          title: "Kalıcı içerik testi",
          image: "/news/studio.jpg",
        },
      ],
    }),
  });

  assert.equal(update.status, 200);
  assert.deepEqual(await update.json(), { ok: true });

  const saved = await request("/api/content");
  assert.equal(saved.status, 200);
  const body = await saved.json();
  assert.equal(body.writers.length, 1);
  assert.equal(body.writers[0].name, "Koza Test Yazarı");
});

test("ana sayfa tarih, mobil ve hareket azaltma kurallarını kaynakta korur", async () => {
  const [page, css] = await Promise.all([
    readFile(new URL("app/page.tsx", projectRoot), "utf8"),
    readFile(new URL("app/globals.css", projectRoot), "utf8"),
  ]);

  assert.match(page, /Intl\.DateTimeFormat\("tr-TR"/);
  assert.match(page, /timeZone:\s*"Europe\/Istanbul"/);
  assert.doesNotMatch(page, /20 Ağustos 2026, Perşembe/);
  assert.match(css, /@media\(max-width:900px\)/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test("kritik marka ve haber görselleri projede bulunur ve boş değildir", async () => {
  const assets = [
    "public/koza-logo.png",
    "public/og-v2.png",
    "public/news/gundem.jpg",
    "public/news/politika.jpg",
    "public/news/dunya.jpg",
    "public/news/ekonomi.jpg",
    "public/news/studio.jpg",
  ];

  for (const asset of assets) {
    const info = await stat(new URL(asset, projectRoot));
    assert.ok(info.isFile(), `${asset} bir dosya olmalı`);
    assert.ok(info.size > 0, `${asset} boş olmamalı`);
  }
});

test("ortak çalışma dokümanı geliştiricilerin makinelerinden bağımsızdır", async () => {
  const agents = await readFile(new URL("AGENTS.md", projectRoot), "utf8");

  assert.match(agents, /https:\/\/github\.com\/umtco12\/kozawebsite/);
  assert.match(agents, /repository kökü/i);
  assert.doesNotMatch(agents, /\/Users\//);
  assert.doesNotMatch(agents, /KOZA_BACKUP/i);
});

test("canlı haber platformu yol haritası kritik ürün alanlarını kapsar", async () => {
  const roadmap = await readFile(
    new URL("YAPILACAKLAR.md", projectRoot),
    "utf8",
  );

  const requiredSections = [
    "Veritabanı ve veri sahipliği",
    "Yönetim paneli ve editoryal süreç",
    "Yapay zekâ destekli haber masası",
    "Medya, video ve canlı yayın",
    "SEO, keşfedilebilirlik ve büyüme",
    "Güvenlik, gizlilik ve operasyon",
    "Test ve kalite kapıları",
    "Aşamalı teslim planı",
  ];

  for (const section of requiredSections) {
    assert.match(roadmap, new RegExp(section, "i"));
  }

  assert.match(roadmap, /editör onayı olmadan/i);
  assert.match(roadmap, /WAL modlu SQLite/);
  assert.match(roadmap, /S3 uyumlu nesne depolama/);
  assert.match(roadmap, /geri yükleme testi/i);
});

test("Hetzner dağıtım dosyaları servis izolasyonu ve uygulama katmanı güvenliği sağlar", async () => {
  const [service, caddy, deploymentNotes, workflow, deployScript, deploySudoers] = await Promise.all([
    readFile(
      new URL("deployment/hetzner/kozatv.service", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("deployment/hetzner/Caddyfile.domain", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("deployment/hetzner/README.md", projectRoot),
      "utf8",
    ),
    readFile(
      new URL(".github/workflows/staging.yml", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("deployment/hetzner/deploy.sh", projectRoot),
      "utf8",
    ),
    readFile(
      new URL("deployment/hetzner/kozatv-deploy.sudoers", projectRoot),
      "utf8",
    ),
  ]);

  assert.match(service, /User=kozatv/);
  assert.match(service, /HOST=127\.0\.0\.1/);
  assert.match(service, /KOZA_DB_PATH=\/srv\/kozatv\/data\/koza\.sqlite/);
  assert.match(service, /KOZA_MEDIA_PATH=\/srv\/kozatv\/data\/media/);
  assert.match(service, /KOZA_MEDIA_QUOTA_BYTES=10737418240/);
  assert.match(service, /NoNewPrivileges=true/);
  assert.match(caddy, /kozatv\.com\.tr, www\.kozatv\.com\.tr/);
  assert.match(caddy, /reverse_proxy 127\.0\.0\.1:8201/);
  assert.doesNotMatch(caddy, /respond @admin 404/);
  assert.doesNotMatch(caddy, /respond @content_write 403/);
  assert.doesNotMatch(deploymentNotes, /WUg%|Elma258020/);
  assert.match(workflow, /branches: \[main\]/);
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7/);
  assert.match(workflow, /secrets\.HETZNER_SSH_KEY/);
  assert.match(workflow, /npm audit --omit=dev/);
  assert.match(workflow, /sudo \/usr\/local\/sbin\/kozatv-deploy/);
  assert.doesNotMatch(workflow, /StrictHostKeyChecking=no/);
  assert.match(deployScript, /\^\[0-9a-f\]\{40\}\$/);
  assert.match(deployScript, /trap rollback ERR/);
  assert.match(deployScript, /systemctl restart kozatv\.service/);
  assert.match(deployScript, /api\/auth\/me/);
  assert.match(workflow, /admin\/giris/);
  assert.match(workflow, /api\/auth\/me/);
  assert.match(
    deploySudoers,
    /^koza-deploy ALL=\(root\) NOPASSWD: \/usr\/local\/sbin\/kozatv-deploy \*$/m,
  );
  assert.doesNotMatch(deploySudoers, /ALL=\(ALL(?::ALL)?\) NOPASSWD: ALL/);
  assert.match(deploymentNotes, /yalnız `kozatv` grubuna üyedir/);
});

test("SQLite ve medya yedeği üretilir, checksum ve geri yükleme ön kontrolünden geçer", async () => {
  const root = await mkdtemp(join(tmpdir(), "koza-backup-test-"));
  const data = join(root, "data"); const backups = join(root, "backups");
  await mkdir(join(data, "media"), { recursive: true });
  await writeFile(join(data, "media", "sample.txt"), "Koza medya yedek testi");
  await execFileAsync("sqlite3", [join(data, "koza.sqlite"), "CREATE TABLE news(id INTEGER PRIMARY KEY,title TEXT); INSERT INTO news(title) VALUES('Koza test');"]);
  await execFileAsync("bash", [new URL("deployment/hetzner/kozatv-backup.sh", projectRoot).pathname], { env: { ...process.env, KOZA_DATA_DIR: data, KOZA_BACKUP_DIR: backups } });
  const [stamp] = await readdir(join(backups, "daily")); const snapshot = join(backups, "daily", stamp);
  assert.equal((await stat(join(snapshot, "koza.sqlite"))).isFile(), true);
  assert.equal((await stat(join(snapshot, "media.tar.gz"))).isFile(), true);
  const verified = await execFileAsync("bash", [new URL("deployment/hetzner/kozatv-restore.sh", projectRoot).pathname, snapshot], { env: { ...process.env, KOZA_RESTORE_VERIFY_ONLY: "1" } });
  assert.match(verified.stdout, /geri yüklemeye hazır/);
});
