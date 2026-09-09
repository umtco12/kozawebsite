#!/usr/bin/env bash
set -Eeuo pipefail

release_root="${KOZA_RELEASES_DIR:-/srv/kozatv/releases}"
current_link="${KOZA_CURRENT_LINK:-/srv/kozatv/current}"
keep_count="${KOZA_RELEASE_KEEP_COUNT:-4}"

if [[ ! "$keep_count" =~ ^[0-9]+$ ]] || (( keep_count < 2 || keep_count > 20 )); then
  echo "Tutulacak sürüm sayısı 2 ile 20 arasında olmalıdır." >&2
  exit 2
fi

if [[ ! -d "$release_root" || ! -L "$current_link" ]]; then
  echo "Sürüm dizini veya aktif sürüm bağlantısı bulunamadı." >&2
  exit 3
fi

release_root="$(cd "$release_root" && pwd -P)"
link_target="$(readlink "$current_link")"
if [[ "$link_target" = /* ]]; then
  active_release="$(cd "$link_target" && pwd -P)"
else
  active_release="$(cd "$(dirname "$current_link")/$link_target" && pwd -P)"
fi

if [[ "$(dirname "$active_release")" != "$release_root" || ! "$(basename "$active_release")" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Aktif sürüm doğrulanamadı; hiçbir dizin silinmedi." >&2
  exit 4
fi

releases=()
while IFS= read -r candidate; do
  candidate="${candidate%/}"
  [[ -d "$candidate" ]] && releases+=("$candidate")
done < <(ls -1dt "$release_root"/*/ 2>/dev/null || true)

kept=("$active_release")
for candidate in "${releases[@]}"; do
  [[ "$candidate" == "$active_release" ]] && continue
  if (( ${#kept[@]} < keep_count )); then kept+=("$candidate"); fi
done

removed=0
for candidate in "${releases[@]}"; do
  preserve=0
  for retained in "${kept[@]}"; do
    [[ "$candidate" == "$retained" ]] && preserve=1 && break
  done
  (( preserve == 1 )) && continue

  name="$(basename "$candidate")"
  if [[ "$(dirname "$candidate")" != "$release_root" || ! "$name" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Güvenli olmayan sürüm yolu atlandı: $candidate" >&2
    continue
  fi
  rm -rf -- "$candidate"
  removed=$((removed + 1))
done

echo "$removed eski sürüm kaldırıldı; aktif sürüm dahil ${#kept[@]} sürüm korundu."
