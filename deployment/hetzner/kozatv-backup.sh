#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

data_dir="${KOZA_DATA_DIR:-/srv/kozatv/data}"
backup_root="${KOZA_BACKUP_DIR:-/srv/kozatv/backups}"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
daily_dir="$backup_root/daily/$stamp"
mkdir -p "$daily_dir"
mkdir -p "$data_dir/media"

sqlite3 "$data_dir/koza.sqlite" ".timeout 10000" ".backup '$daily_dir/koza.sqlite'"
sqlite3 "$daily_dir/koza.sqlite" "PRAGMA quick_check" | grep -qx ok
tar --create --gzip --file "$daily_dir/media.tar.gz" --directory "$data_dir" media
sha256sum "$daily_dir/koza.sqlite" "$daily_dir/media.tar.gz" > "$daily_dir/SHA256SUMS"
printf '{"createdAt":"%s","database":"koza.sqlite","media":"media.tar.gz"}\n' "$stamp" > "$daily_dir/manifest.json"

if [[ "$(date -u +%u)" == "7" ]]; then
  mkdir -p "$backup_root/weekly"
  cp -a "$daily_dir" "$backup_root/weekly/$stamp"
fi
if [[ "$(date -u +%d)" == "01" ]]; then
  mkdir -p "$backup_root/monthly"
  cp -a "$daily_dir" "$backup_root/monthly/$stamp"
fi

find "$backup_root/daily" -mindepth 1 -maxdepth 1 -type d -mtime +7 -exec rm -rf -- {} +
find "$backup_root/weekly" -mindepth 1 -maxdepth 1 -type d -mtime +35 -exec rm -rf -- {} + 2>/dev/null || true
find "$backup_root/monthly" -mindepth 1 -maxdepth 1 -type d -mtime +370 -exec rm -rf -- {} + 2>/dev/null || true

if [[ -n "${KOZA_BACKUP_REMOTE:-}" ]]; then
  rsync -a --delete "$backup_root/" "$KOZA_BACKUP_REMOTE/"
fi

echo "Koza TV yedeği tamamlandı: $daily_dir"
