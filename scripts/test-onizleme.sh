#!/usr/bin/env bash
# Koza TV yerel test önizlemesi.
# Üretim derlemesini ayrı bir test veritabanıyla 127.0.0.1:8299 adresinde çalıştırır.
# Canlı/staging veriye dokunmaz; veritabanı ve medya dosyaları test klasöründe tutulur.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DATA_DIR="${KOZA_PREVIEW_DIR:-$ROOT/.test-onizleme}"
PORT="${PORT:-8299}"

mkdir -p "$DATA_DIR"

echo "→ Üretim derlemesi hazırlanıyor…"
cd "$ROOT"
npm run build >/dev/null

echo "→ Test sunucusu http://127.0.0.1:$PORT adresinde başlıyor (durdurmak için Ctrl+C)"
echo "  Test yönetici hesabı: admin@koza.test / Koza!Test2026Secure"

cd "$ROOT/dist/standalone"
KOZA_DB_PATH="$DATA_DIR/koza-test.sqlite" \
KOZA_MEDIA_PATH="$DATA_DIR/medya" \
KOZA_BOOTSTRAP_ADMIN_EMAIL="admin@koza.test" \
KOZA_BOOTSTRAP_ADMIN_PASSWORD="Koza!Test2026Secure" \
KOZA_BOOTSTRAP_ADMIN_NAME="Koza Test Yöneticisi" \
KOZA_BOOTSTRAP_ADMIN_FORCE_CHANGE=0 \
HOST=127.0.0.1 PORT="$PORT" \
exec node server.js
