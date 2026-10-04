import assert from "node:assert/strict";
import test from "node:test";
import { NEWS_SITEMAP_PAGE_SIZE, parseNewsSitemapPage, renderNewsSitemap } from "../db/news-sitemap-model.mjs";

test("News XML boş haber havuzunda geçerli, boş bir harita üretir", () => {
  const xml = renderNewsSitemap([]);
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.match(xml, /<urlset[^>]+><\/urlset>$/);
  assert.doesNotMatch(xml, /<url>|<news:news>|<sitemap>/);
  assert.equal(renderNewsSitemap([], 1), xml);
  assert.equal(renderNewsSitemap([], 2), null);
});

test("News XML Türkçe başlığı ve özgün tarihi korur, XML karakterlerini güvenle kodlar", () => {
  const xml = renderNewsSitemap([{ slug: "özel-haber&test", title: 'Türkiye & dünya <gündemi> "bugün" \'yarın\'', publishedAt: Date.UTC(2026, 9, 4, 8, 30) }]);
  assert.match(xml, /Türkiye &amp; dünya &lt;gündemi&gt; &quot;bugün&quot; &apos;yarın&apos;/);
  assert.match(xml, /<loc>https:\/\/www\.kozatv\.com\.tr\/haber\/%C3%B6zel-haber%26test<\/loc>/);
  assert.match(xml, /<news:publication_date>2026-10-04T08:30:00.000Z<\/news:publication_date>/);
});

test("News XML tam 1000 haberi tek haritada, 1001 haberi iki dosyada sunar; geçersiz sayfayı reddeder", () => {
  assert.equal(NEWS_SITEMAP_PAGE_SIZE, 1000);
  const entries = Array.from({ length: 1001 }, (_, i) => ({ slug: `haber-${i}`, title: `Haber ${i}`, publishedAt: Date.UTC(2026, 9, 4) }));
  const single = renderNewsSitemap(entries.slice(0, 1000));
  assert.equal([...single.matchAll(/<news:news>/g)].length, 1000);
  assert.doesNotMatch(single, /<sitemapindex/);
  const index = renderNewsSitemap(entries);
  assert.equal([...index.matchAll(/<sitemap>/g)].length, 2);
  assert.equal([...renderNewsSitemap(entries, 1).matchAll(/<news:news>/g)].length, 1000);
  assert.equal([...renderNewsSitemap(entries, 2).matchAll(/<news:news>/g)].length, 1);
  assert.match(renderNewsSitemap(entries, 2), /\/haber\/haber-1000<\/loc>/);
  for (const page of [-1, 1.5, 3, Infinity]) assert.equal(renderNewsSitemap(entries, page), null);
  assert.equal(parseNewsSitemapPage("1.xml"), 1);
  assert.equal(parseNewsSitemapPage("12.xml"), 12);
  for (const value of ["0.xml", "01.xml", "-1.xml", "1.5.xml", "1", "1.XML", "../../1.xml", "9007199254740992.xml"]) assert.equal(parseNewsSitemapPage(value), null);
});
