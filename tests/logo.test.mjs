import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

const root = new URL("../", import.meta.url);
const cleanLogo = "/koza-logo-temiz.svg";

test("Koza TV logosu özgün çizimi koruyup dört köşeyi temiz ve eş biçimde keser", async () => {
  const original = await readFile(new URL("public/koza-logo.png", root));
  const svg = await readFile(new URL("public/koza-logo-temiz.svg", root), "utf8");
  assert.ok(svg.includes('viewBox="20 20 411 164"'), "Görünür alan dört köşede açık zemin bırakmamalı");
  assert.ok(svg.includes('width="411" height="164"'), "Logo boyutu temiz görünür alanla eşleşmeli");
  assert.ok(svg.includes('<clipPath id="panel"><rect x="20" y="20" width="411" height="164" rx="6"/></clipPath>'), "Dört köşe aynı yuvarlak kesime sahip olmalı");
  assert.ok(svg.includes(`data:image/png;base64,${original.toString("base64")}`), "Logo çizimi özgün dosyadan değişmeden gelmeli");

  const rendered = await sharp(Buffer.from(svg)).raw().toBuffer({ resolveWithObject: true });
  const expected = await sharp(original).extract({ left: 28, top: 28, width: 395, height: 148 }).ensureAlpha().raw().toBuffer();
  const protectedArtwork = await sharp(Buffer.from(svg)).extract({ left: 8, top: 8, width: 395, height: 148 }).raw().toBuffer();
  assert.equal(rendered.info.width, 411);
  assert.equal(rendered.info.height, 164);
  assert.equal(Buffer.compare(protectedArtwork, expected), 0, "Harfler, küre ve sloganın pikselleri değişmemeli");

  const pixel = (x, y) => [...rendered.data.subarray((y * 411 + x) * 4, (y * 411 + x + 1) * 4)];
  for (const [x, y] of [[0, 0], [410, 0], [0, 163], [410, 163]]) {
    assert.equal(pixel(x, y)[3], 0, `${x},${y} köşesi saydam ve temiz olmalı`);
  }
  for (const [left, top] of [[0, 0], [395, 0], [0, 148], [395, 148]]) {
    for (let y = top; y < top + 16; y += 1) for (let x = left; x < left + 16; x += 1) {
      const [red, green, blue, alpha] = pixel(x, y);
      if (alpha > 0) assert.ok(red > green * 3 && red > blue * 3, `${x},${y} köşesinde gri/beyaz kalıntı olmamalı`);
    }
  }
});

test("görünen bütün Koza TV logoları temiz varlığı kullanır", async () => {
  for (const file of [
    "app/site-chrome.tsx",
    "app/not-found.tsx",
    "app/admin/giris/form.tsx",
    "app/admin/parola/form.tsx",
    "app/admin/panel.tsx",
    "app/haber/[slug]/page.tsx",
    "db/ad-model.mjs",
  ]) {
    const source = await readFile(new URL(file, root), "utf8");
    assert.ok(source.includes(cleanLogo), `${file} temiz logoyu kullanmalı`);
    assert.ok(!source.includes('src="/koza-logo.png"') && !source.includes('imageUrl: "/koza-logo.png"'), `${file} eski logoyu göstermemeli`);
  }
  const adImage = await readFile(new URL("app/ad-image.tsx", root), "utf8");
  assert.match(adImage, /src === "\/koza-logo\.png" \? "\/koza-logo-temiz\.svg" : src/, "Veritabanındaki eski kurum içi reklamlar da temiz logoya geçmeli");
  const css = await readFile(new URL("app/globals.css", root), "utf8");
  assert.ok(/\.masthead \.brand>img\{[^}]*aspect-ratio:411\/164/.test(css), "Yeni kırpılmış oran üst başlıkta korunmalı");
});
