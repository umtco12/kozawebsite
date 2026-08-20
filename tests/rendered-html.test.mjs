import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";
import {
  defaultContent,
  isValidContentUpdate,
  mergeContentRows,
} from "../app/api/content/content-model.mjs";

const projectRoot = new URL("../", import.meta.url);
const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

const env = {
  ASSETS: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
};

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
};

function request(path, init = {}) {
  return worker.fetch(new Request(`http://localhost${path}`, init), env, ctx);
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
  assert.match(body, /KÖŞE/);
  assert.match(body, /Gündem/);
  assert.match(body, /Koza TV Ana Haber/);
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

  assert.match(body, /YÖNETİM PANELİ/);
  assert.match(body, /İçerik Merkezi/);
  assert.match(body, /Manşet Slider/);
  assert.match(body, /Köşe Yazıları/);
  assert.match(body, /Değişiklikleri Yayınla/);
  assert.match(body, /Yayın Yönetmeni/);
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
  assert.match(roadmap, /Cloudflare D1/);
  assert.match(roadmap, /Cloudflare R2/);
  assert.match(roadmap, /geri yükleme testi/i);
});
