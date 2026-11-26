import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { ensurePublicationDates, publishedContentHash } from "../db/publication-dates.mjs";

test("yayın içeriği karşılaştırması düzenleyicinin blok kimliğinden ve haber yerleşiminden bağımsızdır", () => {
  const article = { title: "Haber", blocks: [{ id: "eski", type: "paragraph", content: "Gövde" }], heroImage: "/eski.webp" };
  assert.equal(publishedContentHash(article), publishedContentHash({ ...article, homepageOrder: 2, blocks: [{ ...article.blocks[0], id: "yeni" }] }));
  assert.equal(publishedContentHash(article), publishedContentHash({ ...article, bodyHtml: "<p>Gövde</p>" }));
  for (const change of [{ heroImage: "/yeni.webp" }, { title: "Yeni" }, { spot: "Ek bilgi" }, { bodyHtml: "<p><em>Gövde</em></p>" }]) {
    assert.notEqual(publishedContentHash(article), publishedContentHash({ ...article, ...change }));
  }
});

test("eski haberlerde doğrulanabilen içerik değişikliği alınır, teknik kayıt saatleri atlanır", t => {
  const db = new Database(":memory:");
  t.after(() => db.close());
  db.exec(`CREATE TABLE content_items(key TEXT PRIMARY KEY,value TEXT,updated_at INTEGER);
    CREATE TABLE articles(id INTEGER PRIMARY KEY,status TEXT,published_at INTEGER,updated_at INTEGER);
    CREATE TABLE article_revisions(id INTEGER PRIMARY KEY,article_id INTEGER,version INTEGER,snapshot TEXT,reason TEXT,created_at INTEGER);
    CREATE TABLE workflow_events(id INTEGER PRIMARY KEY,article_id INTEGER,action TEXT,note TEXT,created_at INTEGER);
    INSERT INTO articles VALUES (1,'published',100,999),(2,'published',100,999),(3,'published',100,999),(4,'published',100,999);
    INSERT INTO workflow_events VALUES (1,4,'correction','Metin düzeltildi',350),(2,4,'assign','',360),(3,4,'correction','Metin düzeltildi',370);`);
  const insert = db.prepare("INSERT INTO article_revisions(article_id,version,snapshot,reason,created_at) VALUES (?,?,?,'save',?)");
  const initial = { status: "published", publishedAt: 100, title: "İlk başlık", body: "Haberin gövdesi." };
  insert.run(1, 1, JSON.stringify(initial), 100);
  insert.run(1, 2, JSON.stringify({ ...initial, title: "Düzeltilen başlık" }), 300);
  insert.run(1, 3, JSON.stringify({ ...initial, title: "Düzeltilen başlık", homepagePlacement: "slider" }), 700);
  insert.run(2, 1, JSON.stringify(initial), 100);
  insert.run(2, 2, JSON.stringify({ ...initial, homepageOrder: 3 }), 600);
  for (let attempt = 0; attempt < 2; attempt++) {
    ensurePublicationDates(db, false);
    assert.deepEqual(db.prepare("SELECT content_modified_at FROM articles ORDER BY id").all().map(row => row.content_modified_at), [300, null, null, 350]);
    assert.deepEqual(db.prepare("SELECT DISTINCT published_at FROM articles").all(), [{ published_at: 100 }]);
  }
});
