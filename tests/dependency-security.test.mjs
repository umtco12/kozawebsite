import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("görsel işleme paketi güvenlik düzeltmesi içeren sharp sürümünü kullanır", async () => {
  const manifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
  const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
  const [major, minor, patch] = lock.packages["node_modules/sharp"].version.split(".").map(Number);
  assert.ok(major > 0 || minor > 35 || (minor === 35 && patch >= 5), "sharp 0.35.5 altına düşmemeli");
  assert.match(manifest.dependencies.sharp, /0\.35\.[5-9]|0\.3[6-9]\./);
});
