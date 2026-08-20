import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after, before } from "node:test";
import {
  defaultContent,
  isValidContentUpdate,
  mergeContentRows,
} from "../app/api/content/content-model.mjs";
import { slugify, validateArticleInput } from "../db/article-model.mjs";

const projectRoot = new URL("../", import.meta.url);
process.env.KOZA_DB_PATH = join(
  tmpdir(),
  `koza-content-test-${process.pid}-${Date.now()}.sqlite`,
);
const port = 32000 + (process.pid % 10000);
const baseUrl = `http://127.0.0.1:${port}`;
let productionServer;

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
      if (response.ok) return;
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
  return fetch(`${baseUrl}${path}`, init);
}

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
  assert.match(body, /AI HABER MASASI/);
  assert.match(body, /Yayın Yönetmeni/);
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

  const published = await request("/api/articles", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...createdBody.article, status: "published" }) });
  assert.equal(published.status, 200);
  const publishedBody = await published.json();
  assert.equal(publishedBody.article.status, "published");
  assert.ok(publishedBody.article.publishedAt);

  const publicPage = await html(`/haber/${publishedBody.article.slug}`);
  assert.match(publicPage, /Koza TV otomatik yayın akışı test haberi/);
  assert.match(publicPage, /"@type":"NewsArticle"/);
  assert.match(publicPage, /Test Editörü/);
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

test("kimlik doğrulama tamamlanana kadar dış haber ve kaynak yazma istekleri kapalıdır", async () => {
  const externalHeaders = { "content-type": "application/json", host: "46.225.169.52", "x-forwarded-host": "46.225.169.52" };
  const blockedArticle = await request("/api/articles", { method: "POST", headers: externalHeaders, body: "{}" });
  const blockedSource = await request("/api/sources", { method: "POST", headers: externalHeaders, body: "{}" });
  assert.equal(blockedArticle.status, 403);
  assert.equal(blockedSource.status, 403);
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

test("Hetzner dağıtım dosyaları servis izolasyonu ve admin koruması sağlar", async () => {
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
  assert.match(service, /NoNewPrivileges=true/);
  assert.match(caddy, /kozatv\.com\.tr, www\.kozatv\.com\.tr/);
  assert.match(caddy, /@admin path \/admin\*/);
  assert.match(caddy, /respond @content_write 403/);
  assert.match(caddy, /\/api\/articles\*/);
  assert.match(caddy, /\/api\/sources\*/);
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
  assert.match(
    deploySudoers,
    /^koza-deploy ALL=\(root\) NOPASSWD: \/usr\/local\/sbin\/kozatv-deploy \*$/m,
  );
  assert.doesNotMatch(deploySudoers, /ALL=\(ALL(?::ALL)?\) NOPASSWD: ALL/);
  assert.match(deploymentNotes, /yalnız `kozatv` grubuna üyedir/);
});
