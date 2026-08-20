#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

backup_dir="${1:-}"
data_dir="${KOZA_DATA_DIR:-/srv/kozatv/data}"
if [[ ! -f "$backup_dir/koza.sqlite" || ! -f "$backup_dir/media.tar.gz" || ! -f "$backup_dir/SHA256SUMS" ]]; then
  echo "Kullanım: kozatv-restore /srv/kozatv/backups/daily/TARIH" >&2
  exit 2
fi

(cd "$backup_dir" && sha256sum --check SHA256SUMS)
sqlite3 "$backup_dir/koza.sqlite" "PRAGMA integrity_check" | grep -qx ok
if [[ "${KOZA_RESTORE_VERIFY_ONLY:-0}" == "1" ]]; then
  echo "Koza TV yedeği geri yüklemeye hazır: $backup_dir"
  exit 0
fi
pre_restore="/srv/kozatv/backups/pre-restore/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$pre_restore"
sqlite3 "$data_dir/koza.sqlite" ".backup '$pre_restore/koza.sqlite'"
tar --create --gzip --file "$pre_restore/media.tar.gz" --directory "$data_dir" media

restore_tmp="$(mktemp -d /srv/kozatv/restore.XXXXXX)"
trap 'rm -rf -- "$restore_tmp"' EXIT
tar --extract --gzip --file "$backup_dir/media.tar.gz" --directory "$restore_tmp"
systemctl stop kozatv.service
install -o kozatv -g kozatv -m 0600 "$backup_dir/koza.sqlite" "$data_dir/koza.sqlite"
rm -rf -- "$data_dir/media"
install -d -o kozatv -g kozatv -m 0750 "$data_dir/media"
cp -a "$restore_tmp/media/." "$data_dir/media/"
chown -R kozatv:kozatv "$data_dir/media"
systemctl start kozatv.service
curl --fail --silent --show-error --retry 10 --retry-delay 1 http://127.0.0.1:8201/ >/dev/null
echo "Koza TV geri yükleme tamamlandı; işlem öncesi kopya: $pre_restore"
