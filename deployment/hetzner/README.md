# Koza TV — Hetzner Debian Yayın Notları

Bu dizin Koza TV'nin mevcut Hetzner Debian sunucusunda çalışması için gereken sürüm kontrollü altyapı dosyalarını içerir. Hesap parolası, SSH anahtarı, admin parolası, API anahtarı veya başka bir gizli değer bu dizine yazılmaz.

## Çalışma şekli

- Uygulama yalnızca `127.0.0.1:8201` üzerinde dinler.
- Caddy dışarıdan gelen HTTP/HTTPS trafiğini uygulamaya iletir.
- Kalıcı SQLite verisi `/srv/kozatv/data/koza.sqlite` altında tutulur.
- Uygulama kodu `/srv/kozatv/current` altında bulunur.
- `kozatv.service` uygulamayı ayrı ve yetkisiz `kozatv` kullanıcısıyla çalıştırır.
- Admin kimlik doğrulaması tamamlanıncaya kadar `/admin` ve içerik yazma istekleri Caddy tarafından dışarıya kapatılır.

## Güvenli yayın sırası

1. Kaynak kodu yeni bir sürüm dizinine aktar.
2. Sunucuda temiz bağımlılık kurulumu, test ve standalone build çalıştır.
3. `kozatv.service` dosyasını yükle ve yalnızca yerel porttan sağlık kontrolü yap.
4. Geçici IP Caddy yapılandırmasını doğrula ve etkinleştir.
5. Ana sayfa, canlı, yazarlar, API ve kapalı admin rotalarını test et.
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

## Canlıya çıkmadan önce kalan güvenlik işleri

- Gerçek admin kimlik doğrulaması ve rol bazlı yetkilendirme
- Hetzner Firewall üzerinde yalnızca 22, 80 ve 443 girişleri
- SSH root girişinin kapatılması ve ayrı deploy kullanıcısı
- Otomatik Hetzner backup veya harici şifreli günlük yedek
- Alan adı DNS geçişi ve HTTPS doğrulaması
- Uptime, disk, bellek, servis ve sertifika alarmları
