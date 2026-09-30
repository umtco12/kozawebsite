import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('ana ekran değişiklikleri için kullanıcı onayı altın kural olarak korunur', async () => {
  const rules = await readFile(new URL('../AGENTS.md', import.meta.url), 'utf8');
  const heading = '## ALTIN KURAL — ANA EKRAN DEĞİŞİKLİĞİ İÇİN ÖNCE KULLANICI ONAYI';
  assert.ok(rules.includes(heading));
  assert.ok(rules.indexOf(heading) < rules.indexOf('## 1. Projenin tek kaynağı'));
  assert.match(rules, /ANA EKRANDA GÖRÜNEN HER DEĞİŞİKLİK İÇİN ÖNCE KULLANICIDAN AÇIK ONAY ALINACAK/);
  assert.match(rules, /Google, reklam, analitik veya SEO entegrasyonu kendiliğinden görsel değişiklik izni sayılmaz/);
});
