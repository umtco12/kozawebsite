# Koza TV Sunucu Taşıma Rehberi

Koza TV üretim adayı Radore üzerinde Node.js 22, PostgreSQL 16, Caddy ve systemd ile çalışır.
Uygulama kodu GitHub'dan yeniden kurulabilir; kalıcı olarak korunması gereken iki veri kümesi vardır:

| Ne | Konum | Güvenli taşıma biçimi |
| --- | --- | --- |
| PostgreSQL veritabanı | yerel `kozatv` veritabanı | `pg_dump --format=custom` ve doğrulanmış `pg_restore` |
| Medya dosyaları | `/srv/kozatv/data/media/` | `rsync` veya doğrulanmış medya arşivi |

## Neden kolay

- **Sağlayıcıya özel veri servisi yok.** PostgreSQL ve düz medya dizini standart Linux araçlarıyla taşınır.
- **Parola repoda tutulmaz.** Uygulama aynı adlı Linux/PostgreSQL kullanıcısıyla yerel peer bağlantısı kullanır.
- **Dağıtım adresi tek değişkende.** `.github/workflows/production.yml`, sunucu adresini `KOZA_HOST` GitHub değişkeninden okur.
- **Yedek gerçek geri yüklemeyle sınanır.** `kozatv-postgres-backup` çıktısı aylık olarak ayrı geçici PostgreSQL veritabanına geri yüklenir.

## Taşıma adımları

1. **Yeni sunucuyu hazırla.** Ubuntu 24.04 LTS, Node.js 22, PostgreSQL 16, Caddy ve `kozatv` sistem kullanıcısını kur.
2. **Dağıtım hesabını kur.** `koza-deploy` yalnız gelen sürüm alanına yazabilmeli ve yalnız `/usr/local/sbin/kozatv-deploy` komutunu sudo ile çalıştırabilmelidir.
3. **SSH host anahtarını sabitle.** `deployment/radore/known_hosts` yeni sunucunun doğrulanmış anahtarıyla güncellenmelidir.
4. **Yazma penceresini kapat.** Son veri kopyası sırasında editörler eski yönetim panelinde haber veya ayar değiştirmemelidir.
5. **Veriyi yedekle ve taşı.** Kaynakta `kozatv-postgres-backup` çalıştır; dump, medya arşivi ve SHA-256 dosyasını hedefe aktar; checksum'ları doğrula.
6. **Ayrı veritabanında geri yükle.** Yeni ve boş bir PostgreSQL veritabanına `pg_restore --exit-on-error --no-owner` ile yükle; tablo ve medya sayımlarını karşılaştır.
7. **Uygulamayı doğrula.** Ayrı portta ana sayfa, yeni haberler, medya, `/admin/giris` ve yetkisiz `/api/auth/me` yanıtını test et.
8. **Atomik geçiş yap.** Doğrulanmış veritabanını etkin adla değiştir, uygulamayı yeniden başlat ve eski veritabanını geri dönüş süresi boyunca koru.
9. **CI/CD hedefini birlikte değiştir.** `KOZA_HOST`, `RADORE_SSH_KEY` ve sabit host anahtarı aynı işlemde güncellenmelidir; yalnız IP değiştirilmez.
10. **DNS ve HTTPS'i doğrula.** Alan adı geçişinden sonra sertifika, canonical adres, medya ve admin akışı kontrol edilmeden eski sunucu kapatılmaz.

## Dikkat edilecek noktalar

- **Yazma boşluğu:** Son yedekten sonra eski sunucuya girilen içerik yeni sunucuda bulunmaz. Eski admin kullanımı geçişte durdurulmalıdır.
- **Geri dönüş:** Eski veritabanı ve önceki uygulama sürümü, yeni ortam birkaç gün doğrulanana kadar silinmez.
- **Medya bütünlüğü:** Yalnız dosya sayısı değil, veritabanındaki her `storage_key` için fiziksel dosya varlığı kontrol edilir.
- **CI/CD:** `main` yalnız Radore üretim adayına gider. Kişisel Hetzner stage sunucusu otomatik dağıtım hedefi değildir.
- **Haricî yedek:** Aynı sunucudaki uygulama yedeği tek başına felaket kurtarma değildir; Radore/Veeam kopyasının farklı fiziksel hedefte olduğu ayrıca doğrulanmalıdır.

## Özet

Taşıma, doğrulanmış PostgreSQL dump'ı ile medya klasörünü aktarmak ve atomik uygulama/veritabanı geçişi yapmaktır. En büyük risk sunucu kurulumu değil, eski ortama yazma devam ederken oluşan veri farkıdır.
