#!/usr/bin/env bash
set -Eeuo pipefail
backup_root="${KOZA_BACKUP_DIR:-/srv/kozatv/backups}"
latest="$(find "$backup_root/daily" -mindepth 1 -maxdepth 1 -type d -print | sort | tail -1)"
[[ -n "$latest" ]] || { echo "Test edilecek Koza TV yedeği bulunamadı" >&2; exit 1; }
KOZA_RESTORE_VERIFY_ONLY=1 /usr/local/sbin/kozatv-restore "$latest"
