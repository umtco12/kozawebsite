export const SYSTEM_STATUS_THRESHOLDS = Object.freeze({
  diskWarningPercent: 75,
  diskCriticalPercent: 85,
  monitorStaleMs: 12 * 60_000,
  backupWarningMs: 30 * 60 * 60_000,
  backupCriticalMs: 36 * 60 * 60_000,
  restoreWarningMs: 35 * 24 * 60 * 60_000,
  restoreCriticalMs: 40 * 24 * 60 * 60_000,
});

const rank = { healthy: 0, warning: 1, critical: 2 };

function finiteNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function statusForAge(ageMs, warningMs, criticalMs) {
  if (!Number.isFinite(ageMs) || ageMs < 0) return "warning";
  if (ageMs >= criticalMs) return "critical";
  if (ageMs >= warningMs) return "warning";
  return "healthy";
}

function worstStatus(statuses) {
  return statuses.reduce((worst, status) => rank[status] > rank[worst] ? status : worst, "healthy");
}

function validSnapshot(value) {
  return value && typeof value === "object" && Number(value.version) === 1
    && ["healthy", "critical"].includes(value.status) && Number.isFinite(Number(value.checkedAt));
}

export function evaluateSystemStatus({ now = Date.now(), disk, database, healthSnapshot, restoreSnapshot }) {
  const thresholds = SYSTEM_STATUS_THRESHOLDS;
  const diskUsedPercent = finiteNumber(disk?.usedPercent, 100);
  const diskStatus = !disk?.available ? "critical"
    : diskUsedPercent >= thresholds.diskCriticalPercent ? "critical"
      : diskUsedPercent >= thresholds.diskWarningPercent ? "warning" : "healthy";

  const databaseStatus = database?.available ? "healthy" : "critical";
  const hasHealthSnapshot = validSnapshot(healthSnapshot);
  const monitorAgeMs = hasHealthSnapshot ? Math.max(0, now - Number(healthSnapshot.checkedAt)) : null;
  const monitorStatus = !hasHealthSnapshot ? "warning"
    : healthSnapshot.status === "critical" || monitorAgeMs > thresholds.monitorStaleMs ? "critical" : "healthy";

  const databaseMediaCount = finiteNumber(database?.mediaRecordCount, 0);
  const snapshotMediaCount = hasHealthSnapshot ? finiteNumber(healthSnapshot.mediaRecordCount, -1) : -1;
  const mediaFileCount = hasHealthSnapshot ? finiteNumber(healthSnapshot.mediaFileCount, -1) : -1;
  const mediaStatus = !database?.available ? "critical"
    : hasHealthSnapshot && (snapshotMediaCount < 0 || mediaFileCount < snapshotMediaCount || mediaFileCount < databaseMediaCount) ? "critical"
      : hasHealthSnapshot ? "healthy" : "warning";

  const latestBackupAt = hasHealthSnapshot ? finiteNumber(healthSnapshot.latestBackupAt, 0) : 0;
  const backupAgeMs = latestBackupAt > 0 ? Math.max(0, now - latestBackupAt) : null;
  const backupStatus = latestBackupAt > 0
    ? statusForAge(backupAgeMs, thresholds.backupWarningMs, thresholds.backupCriticalMs)
    : "warning";

  const hasRestoreSnapshot = validSnapshot(restoreSnapshot);
  const restoreAgeMs = hasRestoreSnapshot ? Math.max(0, now - Number(restoreSnapshot.checkedAt)) : null;
  const restoreStatus = !hasRestoreSnapshot ? "warning"
    : restoreSnapshot.status === "critical" ? "critical"
      : statusForAge(restoreAgeMs, thresholds.restoreWarningMs, thresholds.restoreCriticalMs);

  const services = hasHealthSnapshot ? {
    postgresql: Boolean(healthSnapshot.services?.postgresql),
    application: Boolean(healthSnapshot.services?.application),
    proxy: Boolean(healthSnapshot.services?.proxy),
  } : { postgresql: false, application: false, proxy: false };

  const sections = {
    disk: {
      status: diskStatus,
      totalBytes: finiteNumber(disk?.totalBytes),
      usedBytes: finiteNumber(disk?.usedBytes),
      freeBytes: finiteNumber(disk?.freeBytes),
      usedPercent: Math.max(0, Math.min(100, diskUsedPercent)),
    },
    database: {
      status: databaseStatus,
      engine: database?.engine === "postgresql" ? "PostgreSQL" : "SQLite",
      sizeBytes: finiteNumber(database?.sizeBytes),
      latencyMs: finiteNumber(database?.latencyMs),
      articleCount: finiteNumber(database?.articleCount),
      mediaRecordCount: databaseMediaCount,
    },
    media: {
      status: mediaStatus,
      recordCount: databaseMediaCount,
      fileCount: mediaFileCount >= 0 ? mediaFileCount : null,
      storedBytes: finiteNumber(database?.mediaBytes),
    },
    backup: { status: backupStatus, lastCompletedAt: latestBackupAt || null, ageMs: backupAgeMs },
    restore: {
      status: restoreStatus,
      lastTestedAt: hasRestoreSnapshot ? Number(restoreSnapshot.checkedAt) : null,
      ageMs: restoreAgeMs,
      articleCount: hasRestoreSnapshot ? finiteNumber(restoreSnapshot.articleCount) : null,
      mediaRecordCount: hasRestoreSnapshot ? finiteNumber(restoreSnapshot.mediaRecordCount) : null,
      mediaFileCount: hasRestoreSnapshot ? finiteNumber(restoreSnapshot.mediaFileCount) : null,
    },
    monitor: {
      status: monitorStatus,
      lastCheckedAt: hasHealthSnapshot ? Number(healthSnapshot.checkedAt) : null,
      ageMs: monitorAgeMs,
      services,
    },
  };

  return {
    overall: worstStatus(Object.values(sections).map((section) => section.status)),
    generatedAt: now,
    thresholds,
    ...sections,
  };
}

export function parseSystemSnapshot(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return validSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
