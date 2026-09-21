# Koza TV Radore / PostgreSQL yayını

Bu hedef Ubuntu 24.04 LTS, Node.js 22, PostgreSQL 16, Caddy ve systemd kullanır.

- PostgreSQL yalnız `localhost` ve Unix soketinde dinler; `5432` internete açılmaz.
- Uygulama Linux `kozatv` kullanıcısıyla, aynı adlı PostgreSQL rolüne peer doğrulamasıyla bağlanır. Veritabanı parolası dosyada tutulmaz.
- Kalıcı uygulama veritabanının adı `kozatv`'dir; `/etc/kozatv/app.env` bu veritabanının Unix soketi adresini taşır.
- Kalıcı medya `/srv/kozatv/data/media`, sürümler `/srv/kozatv/releases` altındadır.
- `KOZA_DATABASE_URL` root sahipli `/etc/kozatv/app.env` dosyasından okunur.
- Günlük `pg_dump` + medya arşivi alınır; aylık timer gerçek geçici veritabanına geri yükleme yapar.
- Beş dakikalık sağlık timer'ı PostgreSQL/Caddy/uygulama servislerini, HTTP sözleşmesini, disk sınırını, medya sayısını ve son günlük yedeğin yaşını denetler.
- Radore Veeam haftalık VM yedeği, uygulama yedeğinin yerine değil ikinci fiziksel katmanı olarak kullanılır.
- DNS değiştirilmeden önce IP üzerinden ziyaretçi rotaları, admin giriş/rol akışı, medya ve yazma smoke testi geçmelidir.
- İlk veri kopyasından sonra alan adı geçişinde kısa bir editoryal yazma durdurması uygulanır; son yedek yeniden aktarılır ve PostgreSQL sayımları tekrar karşılaştırılır.

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
- Dağıtım betiği sunucuda temiz kurulum ve tam testi tekrarlar, PostgreSQL+medya yedeği alır, sürümü atomik değiştirir ve sağlık kontrolü başarısızsa önceki sürüme döner.
- Başarılı dağıtımdan sonra yalnız Git commit SHA biçimindeki son dört otomatik sürüm korunur; elle oluşturulan geçiş/geri dönüş sürümlerine dokunulmaz.

Geçici root parolası sohbet, e-posta veya kayıt altında paylaşılmışsa artık güvenli kabul edilmez. Kalıcı SSH yönetimi `koza-admin` anahtarıyla yapılır. Ayrı bir oturumda anahtar ve parolasız `sudo` doğrulandıktan sonra `sshd-hardening.conf`, bulut sağlayıcısının parola kuralından önce okunması için `/etc/ssh/sshd_config.d/00-kozatv-hardening.conf` olarak kurulur; `sshd -t` başarılı olmadan servis yeniden yüklenmez. `sshd -T` çıktısında hem `permitrootlogin no` hem `passwordauthentication no` doğrulanır ve yeni bir `koza-admin` oturumu açılmadan mevcut oturum kapatılmaz. Radore'nin yönetim desteği ayrıca erişim gerektiriyorsa parola/root girişi yeniden açılmaz; sağlayıcıya ayrı ve geri alınabilir anahtar tanımlanır.
