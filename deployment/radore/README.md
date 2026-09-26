# Koza TV Radore / PostgreSQL yayını

Bu hedef Ubuntu 24.04 LTS, Node.js 22, PostgreSQL 16, Caddy ve systemd kullanır.

- PostgreSQL yalnız `localhost` ve Unix soketinde dinler; `5432` internete açılmaz.
- Uygulama Linux `kozatv` kullanıcısıyla, aynı adlı PostgreSQL rolüne peer doğrulamasıyla bağlanır. Veritabanı parolası dosyada tutulmaz.
- Kalıcı uygulama veritabanının adı `kozatv`'dir; `/etc/kozatv/app.env` bu veritabanının Unix soketi adresini taşır.
- Kalıcı medya `/srv/kozatv/data/media`, sürümler `/srv/kozatv/releases` altındadır.
- `KOZA_DATABASE_URL` root sahipli `/etc/kozatv/app.env` dosyasından okunur.
- Her gece bir kez `pg_dump` + medya arşivi alınır; deployment öncesinde medya tekrar paketlenmeden yalnız küçük PostgreSQL yedeği alınır. Aylık timer gerçek geçici veritabanına geri yükleme yapar.
- Beş dakikalık sağlık timer'ı PostgreSQL/Caddy/uygulama servislerini, HTTP sözleşmesini, disk sınırını, medya sayısını ve son günlük yedeğin yaşını denetler.
- Radore Veeam haftalık VM yedeği, uygulama yedeğinin yerine değil ikinci fiziksel katmanı olarak kullanılır.
- DNS değiştirilmeden önce IP üzerinden ziyaretçi rotaları, admin giriş/rol akışı, medya ve yazma smoke testi geçmelidir.
- İlk veri kopyasından sonra alan adı geçişinde kısa bir editoryal yazma durdurması uygulanır; son yedek yeniden aktarılır ve PostgreSQL sayımları tekrar karşılaştırılır.

## Günlük sunucu kontrolü

Yönetici rolündeki kullanıcı yönetim panelindeki **Sistem Durumu** ekranından disk doluluğunu, PostgreSQL erişimini ve boyutunu, haber/medya sayılarını, fiziksel medya eşleşmesini, son günlük yedeği, aylık geri yükleme testini ve beş dakikalık otomatik sağlık denetimini görebilir. Ekran salt okunurdur; bakım komutu çalıştırmaz ve sunucu yolu, IP veya veritabanı bağlantısı göstermez.

- Disk `%75` olduğunda erken uyarı, `%85` olduğunda kritik alarm oluşur.
- Son eksiksiz günlük yedek 30 saati aşınca uyarı, 36 saati aşınca kritik olur.
- Beş dakikalık sağlık kaydı 12 dakikadan eskiyse kritik kabul edilir.
- Fiziksel medya dosyası sayısı veritabanındaki medya kaydından azsa kritik alarm oluşur.
- Gerçek geri yükleme testi ayda bir çalışır; 35 günü aşınca uyarı verir.

SSH ile aynı kontrollerin kısa karşılığı:

```sh
df -h /srv/kozatv
free -h
systemctl is-active postgresql.service kozatv.service caddy.service
systemctl list-timers --all kozatv-postgres-health.timer kozatv-postgres-backup.timer kozatv-postgres-restore-test.timer
sudo /usr/local/sbin/kozatv-postgres-health
sudo -u kozatv psql --dbname=kozatv -c "SELECT pg_size_pretty(pg_database_size(current_database())) AS boyut, (SELECT count(*) FROM articles) AS haber, (SELECT count(*) FROM media_assets) AS medya;"
systemctl status kozatv-postgres-backup.service kozatv-postgres-restore-test.service --no-pager
```

Panel verisi için `kozatv-postgres-health` her çalışmada `/srv/kozatv/data/system-health.json`, gerçek geri yükleme testi de `/srv/kozatv/data/system-restore-test.json` üretir. Dosyalar `kozatv` kullanıcısına ait `0600` izinle tutulur. Betik veya unit değiştiğinde root sahipli kopyalar kontrollü kurulup `systemctl daemon-reload` çalıştırılmalı; ardından iki işlem elle bir kez başarıyla doğrulanmalıdır.

## Alan adı ve HTTPS geçişi

- DNS geçişine kadar `/etc/caddy/Caddyfile` için `Caddyfile.ip` kullanılır.
- Kök alan adı ile `www` kaydı Radore IP'sine alınmadan hemen önce `Caddyfile.domain`, `caddy validate` ile doğrulanıp etkinleştirilir.
- Kök alan adı kalıcı olarak kanonik `https://www.kozatv.com.tr` adresine yönlenir; `www` uygulamayı HTTPS üzerinden sunar.
- DNS tarafında yalnız web kayıtları değiştirilir. MX, SPF, DKIM, DMARC ve e-posta alt alan adları eksiksiz envanter çıkarılmadan taşınmaz.
- Etkinleştirme sonrasında hem HTTP yönlendirmesi hem TLS sertifikası ve `www` üzerindeki ziyaretçi/admin sözleşmesi dışarıdan doğrulanır.

## SQLite'tan PostgreSQL'e güvenli aktarım

Hedef PostgreSQL veritabanı yeni ve boş olmalıdır. Araç mevcut hedef tabloları silmez; hedef doluysa işlemi reddeder. Kaynak SQLite dosyasını geçici bir çalışma kopyasından salt okunur açar, `quick_check` çalıştırır, bütün tabloları transaction içinde taşır ve her tablo için kaynak/hedef sayımını karşılaştırır.

```sh
KOZA_SQLITE_PATH=/guvenli/yedek/koza.sqlite \
KOZA_DATABASE_URL='postgresql:///kozatv?host=%2Fvar%2Frun%2Fpostgresql' \
npm run migrate:postgres
```

Alan adı geçişinde editör girişi kısa süre durdurulur, son Hetzner yedeği yeni ve boş bir PostgreSQL veritabanına aktarılır, sayımlar doğrulanır ve ancak bundan sonra uygulama yeni hedefe geçirilir. Eski veritabanı ve Hetzner sunucusu geri dönüş penceresi boyunca silinmez.

## CI/CD

- `.github/workflows/production.yml`, `main` branch'ine gelen her değişiklikte test, build, lint ve production bağımlılık denetimini tamamladıktan sonra yalnız Radore'ye dağıtır.
- Eski Hetzner staging sunucusu bu hattın hedefi değildir; `HETZNER_SSH_KEY` kullanılmaz.
- GitHub'da `RADORE_SSH_KEY` secret'ı ve Radore adresini taşıyan `KOZA_HOST` değişkeni bulunur.
- Sunucudaki `koza-deploy` hesabı yalnız `/srv/kozatv/incoming` alanına yazabilir ve yalnız `/usr/local/sbin/kozatv-deploy` komutunu sudo ile çalıştırabilir.
- Dağıtım betiği sunucuda temiz kurulum ve tam testi tekrarlar, deployment öncesi yalnız PostgreSQL yedeği alır, sürümü atomik değiştirir ve sağlık kontrolü başarısızsa önceki sürüme döner. Tam medya arşivi gece zamanlayıcısına aittir.
- Başarılı dağıtımdan sonra yalnız Git commit SHA biçimindeki son dört otomatik sürüm korunur; elle oluşturulan geçiş/geri dönüş sürümlerine dokunulmaz.
- Yedek saklama sayıları sabittir: son **3 deployment veritabanı yedeği**, **7 günlük tam yedek**, **4 haftalık** ve **3 aylık** kopya korunur. Haftalık/aylık kopyalar aynı diskte hard-link kullandığı için aynı medya arşivini ikinci kez fiziksel olarak şişirmez.
- `kozatv-backup-retention` yalnız kesin zaman damgası biçimindeki otomatik yedek dizinlerini temizler; elle adlandırılmış kurtarma kopyalarına dokunmaz.

Geçici root parolası sohbet, e-posta veya kayıt altında paylaşılmışsa artık güvenli kabul edilmez. Kalıcı SSH yönetimi `koza-admin` anahtarıyla yapılır. Ayrı bir oturumda anahtar ve parolasız `sudo` doğrulandıktan sonra `sshd-hardening.conf`, bulut sağlayıcısının parola kuralından önce okunması için `/etc/ssh/sshd_config.d/00-kozatv-hardening.conf` olarak kurulur; `sshd -t` başarılı olmadan servis yeniden yüklenmez. `sshd -T` çıktısında hem `permitrootlogin no` hem `passwordauthentication no` doğrulanır ve yeni bir `koza-admin` oturumu açılmadan mevcut oturum kapatılmaz. Radore'nin yönetim desteği ayrıca erişim gerektiriyorsa parola/root girişi yeniden açılmaz; sağlayıcıya ayrı ve geri alınabilir anahtar tanımlanır.
