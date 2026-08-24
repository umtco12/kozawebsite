# Koza TV Sunucu Taşıma Rehberi

Uygulama bilinçli olarak sağlayıcıya bağımlı değildir. Taşınması gereken yalnızca **iki şey** vardır:

| Ne | Nerede | Ne kadar |
| --- | --- | --- |
| Veritabanı | `/srv/kozatv/data/koza.sqlite` | tek dosya |
| Medya dosyaları | `/srv/kozatv/data/media/` | yıl/ay klasörleri |

Bunun dışında kalan her şey (uygulama kodu, systemd birimi, Caddy yapılandırması, yedekleme ve
sağlık betikleri) bu repoda durur ve yeni sunucuda yeniden kurulur.

## Neden kolay

- **Yönetilen servis bağımlılığı yok.** Nesne depolama, yönetilen veritabanı, sağlayıcıya özel
  kuyruk veya fonksiyon kullanılmıyor. Node.js 22 çalışan her Linux sunucusu yeterlidir.
- **Veri tek yerde.** SQLite tek dosya, medya düz dosya. Dışa aktarma aracı gerekmez.
- **Dağıtım adresi tek değişkende.** Dağıtım hattı sunucu adresini `KOZA_HOST` GitHub deposu
  değişkeninden okur. Sunucu değişince yalnızca bu değişken güncellenir; kod değişmez.
- **Yedek zaten taşıma paketidir.** `kozatv-backup.sh` çıktısı, `kozatv-restore.sh` ile yeni
  sunucuda geri yüklenir. Aylık geri yükleme tatbikatı bu yolu düzenli olarak sınar.

## Taşıma adımları

1. **Yeni sunucuyu hazırla.** Debian 13, Node.js 22, `kozatv` sistem kullanıcısı, Caddy.
   `deployment/hetzner/` altındaki birim ve yapılandırma dosyaları olduğu gibi kullanılır.
2. **Dağıtım hesabını kur.** `koza-deploy` kullanıcısı, dar `sudoers` kuralı ve root sahipli
   `kozatv-deploy` betiği (`kozatv-deploy.sudoers`, `deploy.sh`).
3. **SSH host anahtarını yenile.** `deployment/hetzner/known_hosts` dosyasını yeni sunucunun
   anahtarıyla güncelle. Bu dosya kasıtlı olarak sabittir; ortadaki adam saldırısını engeller.
4. **Veriyi taşı.** Çalışan uygulamada SQLite dosyasını doğrudan kopyalamak WAL nedeniyle
   tutarsız kopya üretir. Bunun yerine yedek betiğini kullan:
   - Eski sunucuda `kozatv-backup.sh` çalıştır, checksum'ı doğrula.
   - Yedeği yeni sunucuya aktar, `kozatv-restore.sh` ile geri yükle.
5. **Deponun `KOZA_HOST` değişkenini yeni adrese çevir**, `HETZNER_SSH_KEY` secret'ını yeni
   sunucunun anahtarıyla değiştir.
6. **`main`'e boş bir commit gönder** veya iş akışını elle tetikle. Hat test, build ve sağlık
   kontrollerini çalıştırıp yeni sunucuya dağıtır; hata halinde önceki sürüme döner.
7. **Doğrula.** Ana sayfa, `/son-dakika`, `/canli`, `/admin/giris` ve `/api/auth/me` (401)
   kontrolleri iş akışında zaten var. Ek olarak haber sayısını ve medya klasörü boyutunu
   eski sunucuyla karşılaştır.
8. **DNS'i çevir.** Geçişten önce TTL'i düşür (300 sn). Eski sunucuyu en az 48 saat ayakta tut;
   önbelleklenmiş DNS kayıtları eski adrese gitmeye devam eder.
9. **Eski sunucuyu kapat.** Yalnızca yeni sunucuda birkaç gün sorunsuz yayın yapıldıktan ve
   yedek alındıktan sonra.

## Dikkat edilecek noktalar

- **Kesinti penceresi:** 4. adımdaki veri kopyalamasından DNS geçişine kadar geçen sürede
  eski sunucuya gelen yazma işlemleri (yeni haber, ayar değişikliği) yeni sunucuya taşınmaz.
  Bu yüzden veri kopyalaması yayın akışının en sakin olduğu saatte yapılır ve o aralıkta
  yönetim panelinde işlem yapılmaz.
- **Medya klasörü büyür.** Taşıma öncesi `du -sh /srv/kozatv/data/media` ile ölçüp yeni
  sunucunun diskinin yeteceğini doğrula.
- **CDN varsa origin adresini güncelle.** Cloudflare veya başka bir CDN kullanılıyorsa DNS
  değil CDN'deki origin kaydı değişir; ziyaretçi hiçbir kesinti görmez. CDN kullanmanın
  taşımayı kolaylaştıran yan faydası budur.
- **Yedek hedefi sunucudan bağımsız olmalı.** Yedekler halen aynı sunucuda tutuluyor; taşıma
  bu riski çözmez. İkinci lokasyon ayrı bir iştir (`OPERASYON.md`).

## Özet

Taşıma, bir dosya ile bir klasörü kopyalayıp bir değişkeni güncellemekten oluşur. Riskli olan
kısım sunucunun kendisi değil, **DNS geçişi ve kopyalama anındaki yazma boşluğudur**; ikisi de
planlanabilir.
