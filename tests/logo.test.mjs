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

test("Koza küresi tarayıcı, Google ve mobil için eksiksiz site simgesi seti oluşturur", async () => {
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");
  assert.ok(!layout.includes("/favicon.svg"), "Eski dört kareli geçici favicon kullanılmamalı");
  assert.ok(layout.includes('url: "/koza-favicon-192.png"'), "Google için 48 pikselden büyük, kararlı PNG simgesi tanımlanmalı");
  assert.ok(layout.includes('url: "/koza-favicon-48.png"'), "Tarayıcı sekmeleri için 48 × 48 PNG tanımlanmalı");
  assert.ok(layout.includes('url: "/apple-touch-icon.png"'), "iOS ana ekran simgesi tanımlanmalı");
  assert.ok(layout.includes('manifest: "/site-manifest.json"'), "Mobil site simgesi manifesti tanımlanmalı");

  const expectedSizes = new Map([
    ["public/koza-favicon-48.png", 48],
    ["public/koza-favicon-192.png", 192],
    ["public/koza-favicon-512.png", 512],
  ]);
  for (const [path, size] of expectedSizes) {
    const bytes = await readFile(new URL(path, root));
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.format, "png", `${path} PNG olmalı`);
    assert.equal(metadata.width, size, `${path} kare genişlikte olmalı`);
    assert.equal(metadata.height, size, `${path} kare yükseklikte olmalı`);
    assert.equal(metadata.hasAlpha, true, `${path} açık ve koyu tarayıcı temasında temiz görünmek için saydam olmalı`);

    const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixel = (x, y) => [...data.subarray((y * info.width + x) * 4, (y * info.width + x + 1) * 4)];
    for (const [x, y] of [[0, 0], [size - 1, 0], [0, size - 1], [size - 1, size - 1]]) {
      assert.equal(pixel(x, y)[3], 0, `${path} köşeleri saydam olmalı`);
    }
    let blue = 0;
    let gold = 0;
    for (let offset = 0; offset < data.length; offset += 4) {
      const [red, green, channelBlue, alpha] = data.subarray(offset, offset + 4);
      if (alpha < 128) continue;
      if (channelBlue > red * 1.15 && channelBlue > green * 1.05) blue += 1;
      if (red > 150 && green > 75 && channelBlue < 120) gold += 1;
    }
    assert.ok(blue > size * size * 0.05, `${path} Koza küresinin mavi rengini korumalı`);
    assert.ok(gold > size * size * 0.05, `${path} Koza küresinin altın rengini korumalı`);
  }

  const apple = await sharp(await readFile(new URL("public/apple-touch-icon.png", root))).metadata();
  assert.equal(apple.width, 180);
  assert.equal(apple.height, 180);
  assert.equal(apple.hasAlpha, false, "iOS simgesi opak kurumsal zemine sahip olmalı");

  const maskable = await sharp(await readFile(new URL("public/koza-icon-maskable-512.png", root))).metadata();
  assert.equal(maskable.width, 512);
  assert.equal(maskable.height, 512);
  assert.equal(maskable.hasAlpha, false, "Maskelenebilir Android simgesi opak olmalı");

  const ico = await readFile(new URL("public/favicon.ico", root));
  assert.equal(ico.readUInt16LE(0), 0, "ICO ayrılmış başlangıç alanı geçerli olmalı");
  assert.equal(ico.readUInt16LE(2), 1, "Tarayıcı simgesi ICO türünde olmalı");
  assert.equal(ico.readUInt16LE(4), 4, "ICO 16, 32, 48 ve 64 piksel katmanlarını taşımalı");

  const manifest = JSON.parse(await readFile(new URL("public/site-manifest.json", root), "utf8"));
  assert.equal(manifest.name, "Koza TV");
  assert.equal(manifest.short_name, "Koza TV");
  assert.ok(manifest.icons.some((icon) => icon.src === "/koza-favicon-192.png" && icon.sizes === "192x192" && icon.purpose === "any"));
  assert.ok(manifest.icons.some((icon) => icon.src === "/koza-icon-maskable-512.png" && icon.sizes === "512x512" && icon.purpose === "maskable"));
});
