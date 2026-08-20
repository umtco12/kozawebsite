#!/usr/bin/env bash
set -Eeuo pipefail

db="${KOZA_DB_PATH:-/srv/kozatv/data/koza.sqlite}"
max_disk="${KOZA_MAX_DISK_PERCENT:-85}"
used="$(df --output=pcent /srv/kozatv | tail -1 | tr -dc '0-9')"
[[ "$used" -lt "$max_disk" ]] || { echo "ALARM: Koza TV disk kullanımı %$used" >&2; exit 1; }
systemctl is-active --quiet kozatv.service
systemctl is-active --quiet caddy.service
sqlite3 "$db" "PRAGMA quick_check" | grep -qx ok
curl --fail --silent --show-error http://127.0.0.1:8201/ >/dev/null
echo "Koza TV sağlık kontrolü başarılı: disk %$used"
