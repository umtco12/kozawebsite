# Koza TV Haber Platformu

Koza TV'nin ziyaretçi sitesi, canlı yayın yüzeyi ve editoryal yönetim paneli için geliştirilen Vinext/React uygulamasıdır. Üretim hedefi Hetzner Debian üzerinde Node.js standalone servis, Caddy reverse proxy ve kalıcı SQLite veri katmanıdır.

## Gereksinimler

- Node.js `>=22.13.0`
- npm

## Yerel çalışma

```bash
npm ci
npm run dev
```

Varsayılan yerel adres `http://localhost:3000` olur.

## Doğrulama

```bash
npm test
npm run lint
```

`npm test`, standalone üretim derlemesini oluşturur ve gerçek üretim sunucusu üzerinde rota, SEO, içerik, SQLite ve dağıtım regresyonlarını çalıştırır.

## Üretim

```bash
npm run build
HOST=127.0.0.1 PORT=8201 KOZA_DB_PATH=/srv/kozatv/data/koza.sqlite \
  node dist/standalone/server.js
```

Hetzner servis ve Caddy dosyaları `deployment/hetzner/` altındadır. Gizli bilgiler repoya yazılmaz.

## Ortak dokümanlar

- `AGENTS.md`: çalışma, test ve yayın kuralları
- `YAPILACAKLAR.md`: uçtan uca ürün yol haritası
- `deployment/hetzner/README.md`: Hetzner yayın ve geri dönüş notları
