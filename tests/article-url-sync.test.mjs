import assert from "node:assert/strict";
import test from "node:test";
import { activeArticleAt, syncArticleLocation } from "../app/haber/[slug]/article-url-model.mjs";

const articles = [
  { path: "/haber/ana-haber", title: "Ana haber", top: -900 },
  { path: "/haber/ikinci-haber", title: "İkinci haber", top: 250 },
  { path: "/haber/ucuncu-haber", title: "Üçüncü haber", top: 1450 },
];

test("kesintisiz okumada görünür haber adresi ileri ve geri kaydırmada değişir", () => {
  const location = { pathname: "/haber/ana-haber" };
  const document = { title: "Ana haber | Koza TV" };
  const calls = [];
  const history = {
    state: { router: "korunmalı" },
    replaceState(state, _unused, path) { calls.push({ state, path }); location.pathname = path; },
  };

  assert.equal(activeArticleAt(articles, 200)?.path, "/haber/ana-haber");
  assert.equal(syncArticleLocation({ articles, line: 200, location, history, document }), false);
  assert.equal(syncArticleLocation({ articles, line: 400, location, history, document }), true);
  assert.equal(location.pathname, "/haber/ikinci-haber");
  assert.equal(document.title, "İkinci haber | Koza TV");
  assert.deepEqual(calls, [{ state: history.state, path: "/haber/ikinci-haber" }]);
  assert.equal(syncArticleLocation({ articles, line: 400, location, history, document }), false, "Aynı haberde tekrar geçmiş yazılmamalı");
  assert.equal(syncArticleLocation({ articles, line: 1600, location, history, document }), true);
  assert.equal(location.pathname, "/haber/ucuncu-haber");
  assert.equal(syncArticleLocation({ articles: [articles[0], { ...articles[1], top: 900 }, { ...articles[2], top: 2100 }], line: 400, location, history, document }), true);
  assert.equal(location.pathname, "/haber/ana-haber", "Yukarı kaydırınca ilk haberin adresi geri gelmeli");
  assert.equal(document.title, "Ana haber | Koza TV");
});

test("boş ve geçersiz haber işaretleri adresi değiştirmez", () => {
  const location = { pathname: "/haber/ana-haber" };
  const document = { title: "Ana haber | Koza TV" };
  const history = { state: null, replaceState() { throw new Error("Geçersiz URL yazılmamalı"); } };
  assert.equal(activeArticleAt([], 300), null);
  assert.equal(syncArticleLocation({ articles: [], line: 300, location, history, document }), false);
  assert.equal(syncArticleLocation({ articles: [{ path: "https://example.com/", title: "Dış adres", top: 0 }], line: 300, location, history, document }), false);
  assert.equal(syncArticleLocation({ articles: [{ path: "/haber/taslak/alt-yol", title: "Geçersiz", top: 0 }], line: 300, location, history, document }), false);
  assert.equal(location.pathname, "/haber/ana-haber");
  assert.equal(document.title, "Ana haber | Koza TV");
});
