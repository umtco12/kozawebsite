import { readFile, statfs } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getSystemDatabaseMetrics } from "../../../db";
import { evaluateSystemStatus, parseSystemSnapshot } from "../../../db/system-status.mjs";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

async function readSnapshot(path: string) {
  try { return parseSystemSnapshot(await readFile(path, "utf8")); } catch { return null; }
}

async function diskMetrics(path: string) {
  try {
    const disk = await statfs(path);
    const blockSize = Number(disk.bsize);
    const totalBytes = Number(disk.blocks) * blockSize;
    const freeBytes = Number(disk.bavail) * blockSize;
    const usedBytes = totalBytes - Number(disk.bfree) * blockSize;
    return { available: true, totalBytes, usedBytes, freeBytes, usedPercent: totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 1000) / 10 : 100 };
  } catch {
    return { available: false, totalBytes: 0, usedBytes: 0, freeBytes: 0, usedPercent: 100 };
  }
}

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin"]);
  if (auth.response) return auth.response;

  const mediaPath = resolve(process.env.KOZA_MEDIA_PATH ?? resolve(process.cwd(), "data/media"));
  const dataPath = resolve(process.env.KOZA_DATA_DIR ?? dirname(mediaPath));
  const [disk, healthSnapshot, restoreSnapshot] = await Promise.all([
    diskMetrics(dataPath),
    readSnapshot(resolve(process.env.KOZA_SYSTEM_HEALTH_PATH ?? resolve(dataPath, "system-health.json"))),
    readSnapshot(resolve(process.env.KOZA_RESTORE_STATUS_PATH ?? resolve(dataPath, "system-restore-test.json"))),
  ]);

  let database;
  try { database = getSystemDatabaseMetrics(); } catch { database = { available: false, engine: process.env.KOZA_DATABASE_URL ? "postgresql" : "sqlite", sizeBytes: 0, latencyMs: 0, articleCount: 0, mediaRecordCount: 0, mediaBytes: 0 }; }
  return Response.json(evaluateSystemStatus({ disk, database, healthSnapshot, restoreSnapshot }), { headers: { "cache-control": "no-store" } });
}
