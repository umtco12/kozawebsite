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

Başlıca yüzeyler:

- `/`: veritabanından beslenen haber ana sayfası
- `/haber/[slug]`: NewsArticle yapılandırılmış verili haber detayı
- `/kategori/[slug]`: kategori arşivi
- `/admin`: editör masası, haber editörü ve kaynak merkezi (yalnız yerelde; staging'de kimlik doğrulama tamamlanana kadar kapalı)
- `/api/articles` ve `/api/sources`: doğrulamalı içerik/kaynak API'leri
- `/sitemap.xml`, `/robots.txt` ve `/rss.xml`: arama motoru ve dağıtım yüzeyleri

Yerel SQLite dosyası varsayılan olarak `data/koza.sqlite` konumunda oluşturulur ve ilk çalıştırmada örnek haber/kaynak verisiyle hazırlanır. Farklı bir konum için `KOZA_DB_PATH` kullanılabilir.

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
