#!/usr/bin/env bash
set -Eeuo pipefail

release_id="${1:-}"

if [[ ! "$release_id" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Geçersiz Git commit SHA" >&2
  exit 2
fi

base_dir="/srv/kozatv"
incoming_dir="$base_dir/incoming/$release_id"
release_dir="$base_dir/releases/$release_id"
current_link="$base_dir/current"
previous_release="$(readlink -f "$current_link" 2>/dev/null || true)"

if [[ ! -f "$incoming_dir/package-lock.json" || ! -f "$incoming_dir/package.json" ]]; then
  echo "Aktarılan sürüm eksik" >&2
  exit 3
fi

if [[ -e "$release_dir" ]]; then
  echo "Bu sürüm daha önce hazırlanmış: $release_id" >&2
  exit 4
fi

mv "$incoming_dir" "$release_dir"
chown -R kozatv:kozatv "$release_dir"

runuser -u kozatv -- bash -lc "cd '$release_dir' && npm ci"
runuser -u kozatv -- bash -lc "cd '$release_dir' && npm test"
runuser -u kozatv -- bash -lc "cd '$release_dir' && npm run lint"

ln -sfn "$release_dir" "$current_link"

rollback() {
  if [[ -n "$previous_release" && -d "$previous_release" ]]; then
    ln -sfn "$previous_release" "$current_link"
    systemctl restart kozatv.service || true
  fi
}
trap rollback ERR

systemctl restart kozatv.service

for attempt in {1..20}; do
  if curl --fail --silent --show-error http://127.0.0.1:8201/ >/dev/null \
    && [[ "$(curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:8201/api/auth/me)" == "401" ]] \
    && [[ "$(curl --silent --output /dev/null --write-out '%{http_code}' http://127.0.0.1:8201/admin)" =~ ^30[2378]$ ]]; then
    trap - ERR
    echo "Koza TV staging sürümü aktif: $release_id"
    exit 0
  fi
  sleep 1
done

echo "Sağlık kontrolü başarısız; önceki sürüme dönülüyor" >&2
exit 5
