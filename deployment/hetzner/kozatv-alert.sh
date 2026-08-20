#!/usr/bin/env bash
set -Eeuo pipefail
unit="${1:-kozatv}"
message="Koza TV alarm: $unit başarısız oldu. Sunucu: $(hostname), zaman: $(date --iso-8601=seconds)"
logger --tag kozatv-alert -- "$message"
if [[ -n "${KOZA_ALERT_WEBHOOK:-}" ]]; then
  curl --fail --silent --show-error --max-time 10 -H 'content-type: application/json' --data "{\"text\":\"$message\"}" "$KOZA_ALERT_WEBHOOK" >/dev/null
fi
