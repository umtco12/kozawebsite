import { performance } from "node:perf_hooks";

const baseUrl = new URL(process.env.KOZA_LOAD_BASE_URL || "http://127.0.0.1:8201");
const total = Math.min(Math.max(Number(process.env.KOZA_LOAD_REQUESTS || 180), 1), 1000);
const concurrency = Math.min(Math.max(Number(process.env.KOZA_LOAD_CONCURRENCY || 12), 1), 50);
const articleSlug = process.env.KOZA_LOAD_ARTICLE_SLUG || "selahattin-demirtas-in-tahliyesi-icin-cok-net-konustu";
const paths = ["/", "/kategori/gundem", "/son-dakika", "/haber/" + articleSlug, "/arama?q=koza", "/api/auth/me"];
const loopback = ["127.0.0.1", "localhost"].includes(baseUrl.hostname);

if (!loopback && process.env.KOZA_ALLOW_REMOTE_LOAD !== "1") throw new Error("Uzak yük testi için KOZA_ALLOW_REMOTE_LOAD=1 zorunludur.");

const results = [];
let cursor = 0;

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= total) return;
    const path = paths[index % paths.length];
    const started = performance.now();
    try {
      const response = await fetch(new URL(path, baseUrl), {
        redirect: "manual",
        headers: { "user-agent": "KozaTV-Production-Readiness/1.0" },
      });
      await response.arrayBuffer();
      const expected = path === "/api/auth/me" ? 401 : 200;
      results.push({ path, status: response.status, elapsed: performance.now() - started, ok: response.status === expected });
    } catch (error) {
      results.push({ path, status: 0, elapsed: performance.now() - started, ok: false, error: String(error) });
    }
  }
}

const wallStarted = performance.now();
await Promise.all(Array.from({ length: concurrency }, worker));
const wallMs = performance.now() - wallStarted;
const sorted = results.map((item) => item.elapsed).sort((left, right) => left - right);
const percentile = (value) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))];
const byPath = Object.fromEntries(paths.map((path) => {
  const rows = results.filter((item) => item.path === path);
  return [path, {
    requests: rows.length,
    failures: rows.filter((item) => !item.ok).length,
    averageMs: Math.round(rows.reduce((sum, item) => sum + item.elapsed, 0) / rows.length),
    maximumMs: Math.round(Math.max(...rows.map((item) => item.elapsed))),
  }];
}));
const summary = {
  baseUrl: baseUrl.origin,
  total,
  concurrency,
  failures: results.filter((item) => !item.ok).length,
  wallMs: Math.round(wallMs),
  requestsPerSecond: Number((total / (wallMs / 1000)).toFixed(1)),
  p50Ms: Math.round(percentile(0.50)),
  p95Ms: Math.round(percentile(0.95)),
  p99Ms: Math.round(percentile(0.99)),
  maximumMs: Math.round(sorted.at(-1)),
  byPath,
};

console.log(JSON.stringify(summary, null, 2));
if (summary.failures) process.exitCode = 1;
