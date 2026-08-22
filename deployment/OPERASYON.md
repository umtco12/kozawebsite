# Koza TV Operasyon Kurgusu

Bu doküman Koza TV yayın operasyonunun **nasıl işleyeceğini** tanımlar. Bugün kurulu olan
mekanizmalar ile karar/hesap bekleyen adımlar ayrı ayrı işaretlenmiştir. Uygulama kararı verilmeden
önce bu kurgu ekiple birlikte gözden geçirilir.

Ürün geliştirme önceliği korunur; bu kurgu canlı alan adına geçişten önce tamamlanması gereken
işletme çerçevesidir.

## 1. Bugün kurulu olanlar

| Mekanizma | Nerede | Sıklık | Ne yapar |
| --- | --- | --- | --- |
| Uygulama servisi | `kozatv.service` | sürekli | Node.js 22 standalone servisi, yalnızca `127.0.0.1:8201` |
| Ters vekil | Caddy | sürekli | Dış trafiği uygulamaya taşır |
| Sağlık kontrolü | `kozatv-health.timer` | zamanlanmış | Disk, servis, SQLite bütünlüğü ve ana sayfa yanıtı |
| Yedekleme | `kozatv-backup.timer` | günlük/haftalık/aylık | SQLite + medya yedeği, checksum doğrulaması |
| Geri yükleme tatbikatı | `kozatv-restore-test.timer` | aylık | Yedeği ayrı dizine açıp doğrular |
| Alarm kancası | `kozatv-alert@.service` | olay bazlı | Başarısız birim için webhook çağırır |
| Dağıtım | GitHub Actions → `deploy.sh` | her `main` push | Test + build + atomik sürüm bağlantısı, hatada geri dönüş |
| Denetim kaydı | `audit_logs` tablosu | her yazma | Kim, ne zaman, neyi değiştirdi |

## 2. İzleme kurgusu

### Ölçülecek sinyaller

1. **Erişilebilirlik** — `/`, `/son-dakika`, `/canli`, `/admin/giris` HTTP 200; 5 dakikalık aralık.
2. **Yayın akışı** — son 24 saatte yayınlanan haber sayısı; sıfırsa editöre bilgi, alarm değil.
3. **Hata oranı** — uygulama günlüğünde 5xx sayısı; 5 dakikada 5'ten fazlası alarm.
4. **Yanıt süresi** — ana sayfa sunucu yanıtı 800 ms üzerine çıkarsa uyarı.
5. **Disk** — %85 üzeri uyarı, %92 üzeri alarm (medya kütüphanesi aynı diskte).
6. **Yedek tazeliği** — son başarılı yedek 26 saatten eskiyse alarm.
7. **Canlı yayın kaynağı** — Site Ayarları'nda tanımlı HLS adresi 10 dakikada bir yoklanır; iki
   ardışık başarısızlıkta yayın sorumlusuna alarm.
8. **Kur göstergesi** — TCMB isteği 3 ardışık turda başarısızsa bilgi bildirimi (gösterge kendini
   gizlediği için ziyaretçi yanlış veri görmez).

### Eşik ve seviye

| Seviye | Tanım | Bildirim | Yanıt süresi hedefi |
| --- | --- | --- | --- |
| **P1** | Site veya admin erişilemez, veri kaybı riski | Telefon + grup | 15 dakika |
| **P2** | Canlı yayın kesik, yayın yapılamıyor, yedek başarısız | Grup mesajı | 1 saat |
| **P3** | Tek sayfa hatası, kur göstergesi, performans düşüşü | Günlük özet | 1 iş günü |

### Karar bekleyen

- [ ] Hata izleme aracı seçimi (kendi barındırılan Sentry veya hizmet) ve proje anahtarı
- [ ] Dış uptime kontrolü sağlayıcısı (uygulama sunucusundan bağımsız olmalı)
- [ ] Alarmların gideceği kanal: e-posta grubu, Slack/Telegram webhook veya nöbet telefonu

## 3. Nöbet ve sorumluluk

| Rol | Sorumluluk |
| --- | --- |
| Yayın yönetmeni | İçerik ve yayın kararları, düzeltme onayı, son dakika yönetimi |
| Teknik nöbetçi | P1/P2 olaylarda ilk müdahale, geri dönüş kararı |
| Yönetici | Kullanıcı yetkileri, site ayarları, adres eşlemeleri |

Nöbet listesi ve iletişim bilgileri repoya yazılmaz; ekip içi paylaşılan güvenli notta tutulur.

## 4. Olay müdahale akışı

1. **Tespit** — alarm veya kullanıcı bildirimi.
2. **Sınıflandır** — P1/P2/P3.
3. **Stabilize et** — önce yayını ayağa kaldır, kök nedeni sonra ara.
   - Dağıtım sonrası bozulma → `deploy.sh` önceki sürüme döner.
   - Veri bozulması → yedekten geri yükleme (`kozatv-restore.sh`), önce ayrı dizinde doğrula.
   - Canlı yayın kesintisi → Site Ayarları'ndaki yedek yayın adresi devreye alınır.
4. **Bilgilendir** — P1'de bakım/kesinti ekranı, gerekirse sosyal medya duyurusu.
5. **Kapat** — kök neden, etki süresi ve alınan önlem yazılır.
6. **Öğren** — tekrarı önleyecek iş `YAPILACAKLAR.md`'ye eklenir; **regresyon testi yazılır.**

## 5. Yedekleme ve kurtarma hedefleri

- **RPO (kabul edilebilir veri kaybı):** 24 saat → günlük yedek. Yayın hacmi arttığında saatlik
  SQLite anlık görüntüsüne geçilir.
- **RTO (hedef ayağa kalkma süresi):** 1 saat.
- **Saklama:** 7 günlük, 4 haftalık, 6 aylık yedek.
- **Tatbikat:** Aylık otomatik geri yükleme testi + altı ayda bir elle tam tatbikat.

### Açık risk

- [ ] **Yedekler şu anda aynı sunucuda.** Sunucu kaybında yedek de kaybolur. İkinci lokasyon
      (ayrı sağlayıcıda nesne depolama) canlıya geçişten önce zorunludur.
- [ ] Yedeklerin şifrelenmesi ve erişim anahtarının kimde duracağı kararı.

## 6. Bakım ve yayın penceresi

- Rutin dağıtım her zaman yapılabilir; atomik sürüm geçişi kesinti yaratmaz.
- Şema değişikliği içeren dağıtım, düşük trafik saatinde (03:00–06:00) yapılır.
- Son dakika yoğunluğunda ve seçim/deprem gibi olağanüstü yayın günlerinde dağıtım yapılmaz.
- Bakım modu ekranı henüz yok; kesinti gerektiren işlerden önce eklenmesi gerekir.

## 7. Canlıya geçiş kontrol listesi

Bu maddeler tamamlanmadan `kozatv.com.tr` canlı yayına alınmaz:

- [ ] HTTPS aktif; oturum çerezi `Secure` işaretli
- [ ] Yedekler ikinci lokasyona kopyalanıyor
- [ ] Hata izleme ve dış uptime kontrolü çalışıyor, alarm kanalı test edildi
- [ ] Eski site adres envanteri Adres Yönetimi ekranına yüklendi ve hedefler doğrulandı
- [ ] Site Ayarları'nda canlı yayın adresi, sosyal hesaplar ve künye bilgileri dolduruldu
- [ ] Yük testi yapıldı; yoğun son dakika trafiğinde yanıt süresi hedefte
- [ ] Editör ekibine panel eğitimi verildi
- [ ] Geri dönüş senaryosu bir kez gerçek dağıtımda denendi
