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
active_release="$(readlink -f "$current_link")"
if [[ "$(dirname "$active_release")" != "$release_root" ]]; then
  echo "Aktif sürüm doğrulanamadı; hiçbir dizin silinmedi." >&2
  exit 4
fi

git_releases=()
while IFS= read -r candidate; do
  candidate="${candidate%/}"
  name="$(basename "$candidate")"
  [[ -d "$candidate" && "$name" =~ ^[0-9a-f]{40}$ ]] && git_releases+=("$candidate")
done < <(ls -1dt "$release_root"/*/ 2>/dev/null || true)

kept=()
if [[ "$(basename "$active_release")" =~ ^[0-9a-f]{40}$ ]]; then kept+=("$active_release"); fi
for candidate in "${git_releases[@]}"; do
  [[ "$candidate" == "$active_release" ]] && continue
  if (( ${#kept[@]} < keep_count )); then kept+=("$candidate"); fi
done

removed=0
for candidate in "${git_releases[@]}"; do
  preserve=0
  for retained in "${kept[@]}"; do [[ "$candidate" == "$retained" ]] && preserve=1 && break; done
  (( preserve == 1 )) && continue
  rm -rf -- "$candidate"
  removed=$((removed + 1))
done

echo "$removed eski Git sürümü kaldırıldı; elle oluşturulan geçiş sürümlerine dokunulmadı."
