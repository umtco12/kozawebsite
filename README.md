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
- `/admin/giris`: güvenli yönetim girişi; `/admin`: rol bazlı editör masası, haber editörü, kaynak ve kullanıcı merkezi
- `/api/auth/*` ve `/api/users`: süreli oturum, zorunlu parola değişimi ve yöneticiye özel kullanıcı yönetimi
- `/api/articles` ve `/api/sources`: oturum ve rol kontrolü bulunan içerik/kaynak API'leri
- `/api/categories`: menü sırası, görünürlük ve kategori SEO yönetimi
- `/api/media` ve `/media/*`: kalıcı medya kütüphanesi ve görsel sunumu
- `/sitemap.xml`, `/robots.txt` ve `/rss.xml`: arama motoru ve dağıtım yüzeyleri

Yerel SQLite dosyası varsayılan olarak `data/koza.sqlite` konumunda oluşturulur ve ilk çalıştırmada örnek haber/kaynak verisiyle hazırlanır. Farklı bir konum için `KOZA_DB_PATH` kullanılabilir.

Yönetim parolaları scrypt ile tek yönlü özetlenir; açık parola veritabanına veya repoya yazılmaz. Oturumlar 12 saatlik, `HttpOnly` ve `SameSite=Lax` çerezlerle çalışır. Beş hatalı giriş hesabı 15 dakika kilitler. Roller `admin`, `publisher`, `editor`, `reporter` ve `viewer` olarak uygulanır; yalnız yönetici yeni ekip hesabı açabilir ve tüm geçici parolalar ilk girişte değiştirilir. İlk sunucu hesabı `scripts/create-admin.mjs` ile parolayı yalnız standart girdiden okuyarak hazırlanır.

Yüklenen görseller yerelde `data/media/`, Hetzner'de `/srv/kozatv/data/media/` altında yıl/ay ve içerik özetiyle adlandırılarak saklanır. Bu dizin sürüm klasörlerinin dışındadır; yeni dağıtım ve geri dönüşlerde silinmez. SQLite yalnız dosya yolu, MIME türü, boyut, alt metin ve fotoğraf kredisini tutar. JPG, PNG, WebP ve GIF dosyaları içerik imzasıyla doğrulanır ve dosya başına 12 MB sınırı uygulanır. Hetzner medya alanı varsayılan 10 GB kotayla çalışır ve dosya sistemi üzerinde en az 1 GB boş alan bırakılır. Büyük video dosyaları sunucu diskine yüklenmez; mevcut editörde video URL'si kullanılır ve üretim ölçeğinde S3 uyumlu nesne depolamaya taşınacaktır.

## Doğrulama

```bash
npm test
npm run lint
```

`npm test`, standalone üretim derlemesini oluşturur ve gerçek üretim sunucusu üzerinde rota, SEO, içerik, SQLite ve dağıtım regresyonlarını çalıştırır.

## Üretim

```bash
npm run build
HOST=127.0.0.1 PORT=8201 KOZA_DB_PATH=/srv/kozatv/data/koza.sqlite KOZA_MEDIA_PATH=/srv/kozatv/data/media \
  node dist/standalone/server.js
```

Hetzner servis ve Caddy dosyaları `deployment/hetzner/` altındadır. Gizli bilgiler repoya yazılmaz.

## Ortak dokümanlar

- `AGENTS.md`: çalışma, test ve yayın kuralları
- `YAPILACAKLAR.md`: uçtan uca ürün yol haritası
- `deployment/hetzner/README.md`: Hetzner yayın ve geri dönüş notları
