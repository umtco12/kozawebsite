# Koza TV — Hetzner Debian Yayın Notları

Bu dizin Koza TV'nin mevcut Hetzner Debian sunucusunda çalışması için gereken sürüm kontrollü altyapı dosyalarını içerir. Hesap parolası, SSH anahtarı, admin parolası, API anahtarı veya başka bir gizli değer bu dizine yazılmaz.

## Çalışma şekli

- Uygulama yalnızca `127.0.0.1:8201` üzerinde dinler.
- Caddy dışarıdan gelen HTTP/HTTPS trafiğini uygulamaya iletir.
- Kalıcı SQLite verisi `/srv/kozatv/data/koza.sqlite` altında tutulur.
- Uygulama kodu `/srv/kozatv/current` altında bulunur.
- `kozatv.service` uygulamayı ayrı ve yetkisiz `kozatv` kullanıcısıyla çalıştırır.
- Caddy güvenlik başlıklarını uygular; `/admin` ve yönetim API'leri uygulamanın süreli oturum ve rol kontrolleriyle korunur.

## Güvenli yayın sırası

1. Kaynak kodu yeni bir sürüm dizinine aktar.
2. Sunucuda temiz bağımlılık kurulumu, test ve standalone build çalıştır.
3. `kozatv.service` dosyasını yükle ve yalnızca yerel porttan sağlık kontrolü yap.
4. Geçici IP Caddy yapılandırmasını doğrula ve etkinleştir.
5. Ana sayfa, canlı, yazarlar, yetkisiz admin yönlendirmesi, giriş ve rol kontrollerini test et.
6. DNS `A` kayıtlarını yeni sunucuya yönlendir.
7. DNS yayıldığında alan adı Caddy yapılandırmasına geç; HTTPS sertifikasını doğrula.
8. Son canlı kontroller geçtikten sonra eski yayın altyapısını kapat.

## Continuous integration ve staging dağıtımı

- `.github/workflows/staging.yml`, `main` branch'ine her push sonrasında çalışır.
- GitHub runner önce temiz kurulum, üretim bağımlılık denetimi, test/build ve lint yapar.
- Başarılı kaynak kodu yalnız SSH host anahtarı doğrulanarak `koza-deploy` kullanıcısına aktarılır.
- `koza-deploy`, `/srv/kozatv` yolunu geçebilmek için yalnız `kozatv` grubuna üyedir; `incoming` dizininin sahibi olmaya devam eder.
- Root tarafından sahip olunan `/usr/local/sbin/kozatv-deploy` yeni sürümü sunucuda tekrar test eder.
- `koza-deploy` yalnızca bu doğrulamalı deploy komutunu parolasız çalıştırabilir; genel root yetkisi yoktur.
- Aktif sürüm sembolik bağlantıyla atomik değiştirilir; sağlık kontrolü başarısızsa önceki sürüme dönülür.
- GitHub'da yalnız `HETZNER_SSH_KEY` repository secret'ı gerekir. Özel anahtar repoya yazılmaz.
- Staging adresi `http://46.225.169.52/` olarak kabul edilir.

## Geri dönüş

- Uygulama açılmazsa Caddy'nin son çalışan yapılandırması geri yüklenir.
- Veritabanı dosyası deploy dizininden ayrı olduğu için kod sürümü değişse de korunur.
- Her migration öncesi SQLite yedeği alınır; migration ile kod aynı sürümde yayınlanır.

## Yedekleme, geri yükleme ve alarm

- `kozatv-backup.timer` her gece WAL uyumlu SQLite snapshot'ı ve medya arşivi üretir; SHA-256 doğrulaması yapar.
- Günlük kopyalar 7 gün, haftalık kopyalar 35 gün, aylık kopyalar 370 gün tutulur.
- `KOZA_BACKUP_REMOTE` tanımlanırsa yedek ağacı `rsync` ile ikinci hedefe aktarılır.
- `kozatv-restore /srv/kozatv/backups/daily/TARIH` doğrulama, işlem öncesi snapshot, geri yükleme ve uygulama sağlık kontrolünü tek komutta yürütür.
- Aylık geri yüklenebilirlik testi; beş dakikalık disk, servis ve SQLite sağlık kontrolü systemd timer'larıyla çalışır.
- Hatalar systemd günlüğüne yazılır; `/etc/kozatv/alerts.env` içinde `KOZA_ALERT_WEBHOOK` verilirse webhook'a da gönderilir.
- Stage sunucusunda UFW yalnız 22, 80 ve 443 TCP portlarını açar. SSH parola ve root girişi kapalıdır; operasyon erişimi yalnız anahtarlı `koza-admin` hesabıyla yapılır.

## Canlıya çıkmadan önce kalan güvenlik işleri

- Çok faktörlü giriş, IP tabanlı giriş hız sınırı ve şüpheli giriş alarmı
- Harici yedek hedefinin ve alarm webhook'unun müşteri hesabıyla tanımlanması
- Alan adı DNS geçişi ve HTTPS doğrulaması
- Uptime, disk, bellek, servis ve sertifika alarmları
