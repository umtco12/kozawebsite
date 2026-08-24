# Koza TV Canlı Haber Platformu — Uçtan Uca Yapılacaklar

Bu doküman Koza TV web sitesinin bugünkü arayüz prototipinden; gerçek verisi, güvenli yönetim paneli, editoryal iş akışı, yapay zekâ destekli haber masası, medya altyapısı, SEO sistemi ve canlı yayın operasyonu olan üretim seviyesinde bir haber platformuna dönüşüm planıdır.

Doküman yaşayan bir ürün planıdır. Her tamamlanan işaret kutusu aynı değişiklikle güncellenir. Teknik ve görsel kararlar `AGENTS.md` kurallarına, özellikle de **testsiz iş tamamlanmış sayılmaz** ilkesine uyar.

## 1. Ürün hedefi

Koza TV; masaüstü ve mobilde hızlı açılan, editörlerin dakikalar içinde güvenli yayın yapabildiği, arama motorlarının doğru anlayabildiği ve yoğun son dakika trafiğinde ayakta kalan ulusal bir haber ve canlı yayın platformu olacaktır.

Başarı ölçütleri:

- Haber, kategori, yazar, video ve canlı yayın sayfalarının gerçek veriden üretilmesi.
- Editör onayı olmadan hiçbir yapay zekâ içeriğinin yayınlanamaması.
- Haber yayına alındığında sitemap, RSS, sosyal paylaşım ve ana sayfa alanlarının otomatik güncellenmesi.
- Mobil ziyaretçide hızlı ilk açılış, sıfıra yakın görsel kayma ve kesintisiz okunabilirlik.
- Eski Koza TV URL değerinin kaybedilmemesi; taşınan adreslerde kalıcı yönlendirme kullanılması.
- Tüm kritik işlemlerin kim tarafından, ne zaman yapıldığının denetim kaydında tutulması.
- Veritabanı ve medya yedeklerinin düzenli alınması ve geri yükleme tatbikatının yapılması.

## 2. Bugünkü durum

### Hazır olan temel

- [x] Koza TV görsel yönüne sahip responsive ana sayfa prototipi
- [x] Canlı yayın ve yazarlar sayfası için ilk arayüzler
- [x] Admin içerik merkezi için ilk arayüz
- [x] Temel SEO, Open Graph ve X/Twitter metadata
- [x] Hetzner standalone Node.js servisi ve kalıcı SQLite `content_items` tablosu
- [x] Ayrı `kozatv` sistem kullanıcısı, systemd servisi ve Caddy reverse proxy temeli
- [x] Build, HTML regresyonu, erişilebilirlik ve temel içerik modeli testleri
- [x] Ortak çalışma ve zorunlu test kuralları

### Üretime çıkmadan önce tamamlanması gereken ana boşluklar

- [x] Gerçek haber veri modeli ve içerik detay rotaları
- [x] Güvenli giriş, kullanıcı oluşturma ve rol bazlı yetkilendirme
- [ ] Tam editoryal iş akışı, revizyon geçmişi ve denetim kaydı
- [ ] Görsel/video yükleme, işleme ve kalıcı medya depolama
- [ ] Yapay zekâ destekli kaynak toplama ve editör onay kuyruğu
- [ ] Arama, kategori, etiket, arşiv, video ve program sayfaları (arama, kategori, video ve yazar arşivi tamamlandı; etiket ve program sayfaları bekliyor)
- [ ] Haber bazlı yapılandırılmış veri, sitemap, RSS ve Google News gereksinimleri
- [ ] İzleme, hata alarmı, yedekleme, güvenlik ve trafik/yük testleri (operasyon kurgusu `deployment/OPERASYON.md` içinde tanımlandı)
- [ ] Staging ve canlı ortam için otomatik test/dağıtım hattı

## 3. Hedef teknik mimari

İlk üretim sürümü mevcut Hetzner Debian sunucusunda çalışacaktır:

- **Uygulama:** React 19 + Vinext + TypeScript
- **Çalışma ortamı:** Node.js 22 standalone sunucu + systemd
- **İlişkisel veri:** İlk aşamada WAL modlu SQLite; trafik ve yazma hacmi gerektiğinde PostgreSQL'e kontrollü geçiş
- **Medya:** S3 uyumlu nesne depolama; SQLite yalnızca medya metadata'sını tutar
- **Önbellek:** CDN ve doğru `Cache-Control`; içerik güncellenince kontrollü temizleme
- **Arama:** İlk sürümde SQLite FTS/indeksli arama; hacim arttığında ayrı arama servisine geçiş için soyutlanmış arama katmanı
- **Canlı yayın:** Yayın sağlayıcısının HLS oynatıcısı, kesinti ekranı ve alternatif yayın kaynağı
- **Gözlemleme:** Uygulama hataları, performans metrikleri, yayın başarısızlıkları ve kaynak çekme görevleri için merkezi kayıt ve alarm

Kalıcı kullanıcı ve içerik verileri tarayıcı hafızasında tutulmaz. SQLite/PostgreSQL yapılandırılmış verinin, S3 uyumlu nesne depolama ise görsel/video/dosya baytlarının asıl kaynağıdır.

## 4. Veritabanı ve veri sahipliği

Mevcut genel `content_items` tablosu prototip içindir. Üretim şeması ilişkisel ve denetlenebilir olacaktır.

### Temel tablolar

| Alan | Sorumluluk |
| --- | --- |
| `users` | Yönetim paneli kullanıcısı, aktiflik, son giriş |
| `roles`, `permissions`, `user_roles` | Yönetici, yayın yönetmeni, editör, muhabir, görüntüleyici yetkileri |
| `articles` | Başlık, spot, gövde, durum, slug, yayın tarihi, SEO alanları |
| `article_revisions` | Her kayıt/yayın öncesi sürüm, değiştiren kişi ve değişiklik özeti |
| `categories`, `article_categories` | Ana ve alt kategori ilişkileri |
| `tags`, `article_tags` | Etiketleme ve konu sayfaları |
| `authors`, `article_authors` | Yazar profili ve çoklu imza desteği |
| `media_assets` | Nesne depolama anahtarı, tür, boyut, oran, alt metin, telif ve sahibi |
| `article_media` | Haber içi kapak, galeri ve video sıralaması |
| `breaking_news` | Son dakika metni, bağlantısı, başlangıç/bitiş zamanı ve önceliği |
| `live_streams` | HLS kaynağı, yayın durumu, yedek kaynak ve program bilgisi |
| `programs`, `episodes` | TV programı, bölüm, sunucu ve video arşivi |
| `redirects` | Eski URL'den yeni URL'ye 301 eşlemesi (tamamlandı) |
| `ai_sources` | Kaynak URL/RSS, izin durumu, çekme sıklığı ve aktiflik |
| `ingestion_jobs` | Kaynak çekme görevi, sonuç, hata, süre ve tekrar deneme |
| `story_candidates` | Toplanan haber adayı, orijinal kaynak ve editörlük durumu |
| `content_checks` | Kaynak, benzerlik, telif, doğruluk ve moderasyon sonuçları |
| `scheduled_publications` | Zamanlanmış yayın/geri çekme görevleri |
| `audit_logs` | Değiştirilemez nitelikte kullanıcı, işlem, hedef ve zaman kaydı |
| `site_settings` | İletişim, sosyal hesap, künye ve yayın ayarları (tamamlandı) |

### Veri kuralları

- Kimlikler tahmin edilmesi zor, kalıcı değerler olmalıdır; dış URL'de ardışık veritabanı ID'si kullanılmamalıdır.
- Slug benzersiz olmalı; başlık değişse bile yayımlanmış URL kendiliğinden değişmemelidir.
- Haber silme varsayılan olarak geri alınabilir arşivleme olmalıdır; kalıcı silme yalnızca yetkili yöneticiye açık olmalıdır.
- Tarihler UTC saklanmalı, arayüzde `Europe/Istanbul` saat diliminde gösterilmelidir.
- Sık sorgulanan durum, yayın tarihi, slug, kategori, kaynak ve görev alanları gerçek sorgu planlarına göre indekslenmelidir.
- Her migration ileriye dönük, tekrar üretilebilir ve staging verisi üzerinde test edilmiş olmalıdır.
- Kişisel veri ve erişim kayıtları için saklama süresi ile silme politikası tanımlanmalıdır.

## 5. Ziyaretçi sitesi

### Sayfalar

- [x] Ana sayfa: manşet, son dakika, öne çıkanlar, kategori akışları, video, yazarlar ve reklam alanları
- [x] Haber detayı: zengin içerik, galeri/video, yazar, kaynak, tarih, ilgili haberler ve paylaşım
- [ ] Kategori ve alt kategori: sayfalama, öne çıkan içerik ve filtreleme
- [ ] Etiket/konu sayfası ve haber arşivi
- [x] Yazar listesi ve yazar profil/yazı arşivi
- [ ] Video merkezi, program ve bölüm detayları (video merkezi tamamlandı; program/bölüm bekliyor)
- [x] Canlı yayın: yayın programı, kesinti ekranı, panelden HLS ve yedek kaynak tanımı (yayın adresi müşteriden bekleniyor)
- [x] Site içi arama: boş sonuç ve popüler haber önerileri (yazım hatası toleransı sonraki adım)
- [x] Kurumsal sayfalar: hakkımızda, yayın ilkeleri, künye, iletişim, KVKK, gizlilik ve çerez politikası
- [ ] Özel 404, 410 ve bakım/kesinti ekranları (özel 404 tamamlandı)

### Tasarım sistemi

- [ ] Renk, tipografi, boşluk, grid, radius, gölge ve hareket token'ları
- [ ] Header, mega menü, son dakika bandı, kart, medya, reklam ve form bileşenleri
- [ ] Masaüstü, tablet ve mobil için belgelenmiş kırılım davranışları
- [ ] Koyu değil, haber tüketimini önceleyen yüksek kontrastlı okuma yüzeyi
- [ ] Uzun başlık, eksik görsel, yoğun akış ve Türkçe karakter durumları
- [ ] Klavye erişimi, görünür odak, ekran okuyucu etiketleri ve azaltılmış hareket

## 6. Yönetim paneli ve editoryal süreç

### Güvenlik ve roller

- [x] Uygulamaya ait güvenli kimlik doğrulama ve staging entegrasyonu
- [x] Sunucu tarafında oturum ve her yönetim API'si için rol/yetki kontrolü
- [x] Yönetici, yayın yönetmeni, editör, muhabir ve görüntüleyici yetki matrisi
- [ ] Yönetici, yayın yönetmeni, editör, muhabir ve görüntüleyici yetki matrisi
- [ ] Çok faktörlü giriş, oturum sonlandırma ve şüpheli giriş alarmı
- [x] Hesap oluşturma, pasife alma ve yetki değişikliği kaydı (e-posta ile davet sonraki adım)

### Haber üretim akışı

1. Muhabir veya AI haber adayı oluşturur.
2. İçerik taslak olarak kaydedilir; otomatik kayıt ve revizyon geçmişi oluşur.
3. Editör kaynak, doğruluk, başlık, görsel, telif ve SEO kontrollerini tamamlar.
4. Yayın yönetmeni gerekiyorsa ikinci onayı verir.
5. İçerik hemen yayımlanır veya İstanbul saatine göre zamanlanır.
6. Güncelleme ve geri çekme işlemleri gerekçesiyle birlikte denetim kaydına yazılır.

### Editör araçları

- [ ] Blok tabanlı zengin metin editörü: başlık, metin, alıntı, ara başlık, liste, görsel, galeri, video ve gömme
- [ ] Otomatik kayıt, taslak önizleme, cihaz önizleme ve revizyon karşılaştırma
- [ ] Kapak kırpma, odak noktası, alternatif metin ve telif zorunluluğu
- [ ] SEO başlığı/açıklaması, URL önizlemesi ve sosyal paylaşım kartı önizlemesi
- [ ] İç link ve ilgili haber önerileri
- [ ] Yayın takvimi, son dakika yönetimi ve ana sayfa sürükle-bırak yerleşimi
- [ ] Eş zamanlı düzenleme uyarısı ve kayıt çakışması çözümü
- [ ] Yayın öncesi zorunlu kontrol listesi

## 7. Yapay zekâ destekli haber masası

AI sistemi otomatik yayıncı değil, editör yardımcısı olacaktır.

### Kaynak yönetimi

- [ ] Yetkili kullanıcının RSS, API veya izinli sayfa URL'si ekleyebilmesi
- [ ] Kaynak adı, türü, çekme sıklığı, kategori eşlemesi ve kullanım/telif notları
- [ ] Alan adı izin listesi, robots ve yayın hakkı kontrolü
- [ ] Zamanlanmış çekme, manuel çalıştırma, durdurma ve hata tekrar deneme

### İşleme hattı

1. Kaynak alınır ve orijinal URL/zaman bilgisi saklanır.
2. Aynı URL, başlık ve anlamsal benzerlikle tekrar haber kontrol edilir.
3. Metin, görsel ve video adayları ayrıştırılır; telif ve kullanım bilgisi işaretlenir.
4. AI; özet, alternatif başlık, kategori, etiket ve SEO önerisi üretir.
5. İddialar kaynak cümlelerle eşleştirilir; belirsiz alanlar editöre uyarı olarak gösterilir.
6. Aday yalnızca inceleme kuyruğuna girer.
7. Editör düzenler, reddeder, birleştirir, zamanlar veya yayınlar.

### Zorunlu korumalar

- [ ] Editör onayı olmayan AI adayına yayın durumu verilememesi
- [ ] Kaynak bağlantısının ve üretim geçmişinin silinememesi
- [ ] Prompt enjeksiyonu, zararlı HTML ve şüpheli dosya kontrolleri
- [ ] Kaynak başına hız sınırı, kota, zaman aşımı ve devre kesici
- [ ] Yanlış bilgi, kişi/kurum iddiası ve hassas içerik için yüksek risk uyarısı
- [ ] Aynı olayın farklı kaynaklarını tek adayda birleştirme
- [ ] Üretilen/değiştirilen alanları editöre görünür biçimde işaretleme

## 8. Medya, video ve canlı yayın

- S3 uyumlu nesne depolama aktifleştirilerek orijinal dosya ve türevler ayrı anahtarlarla saklanacaktır.
- Görsel yüklemede dosya türü, gerçek MIME, boyut, çözünürlük ve zararlı içerik kontrolü yapılacaktır.
- WebP/AVIF türevleri, responsive boyutlar, düşük kaliteli önizleme ve odak noktası üretilecektir.
- Her medya için alt metin, açıklama, fotoğrafçı/ajans, lisans ve kullanım bitiş tarihi tutulacaktır.
- Büyük videolar doğrudan uygulama sunucusundan geçirilmeden yüklenmeli; işleme durumu izlenmelidir.
- Canlı yayın için HLS sağlık kontrolü, poster, sessiz otomatik başlatma politikası, yedek kaynak ve erişilebilir oynatıcı sağlanacaktır.
- CDN önbelleği ile imzalı yönetim yükleme adresleri birbirinden ayrılacaktır.

## 9. SEO, keşfedilebilirlik ve büyüme

- [ ] Her haber için benzersiz title, description, canonical, Open Graph ve X alanları
- [ ] `NewsArticle`, `VideoObject`, `BreadcrumbList`, `Person` ve `Organization` yapılandırılmış verileri
- [ ] Dinamik XML sitemap indeksleri: haber, video, kategori, yazar ve genel sayfalar
- [ ] Son 48 saat haberlerini içeren Google News sitemap
- [ ] RSS akışları: genel, kategori ve yazar bazlı
- [ ] Robots kuralları; admin, önizleme, arama parametreleri ve taslakların indeks dışı tutulması
- [x] Eski siteden URL envanteri, 301 eşleme tablosu ve kırık bağlantı taraması (aktarımda eşleme otomatik oluşur)
- [ ] İç bağlantı, ilgili haber, breadcrumb ve konu kümeleri
- [ ] Görsel SEO: anlamlı dosya/alt metin, boyut, telif ve image sitemap
- [ ] Core Web Vitals bütçeleri: LCP ≤ 2,5 sn, INP ≤ 200 ms, CLS ≤ 0,1 hedefi
- [ ] Google Search Console, Bing Webmaster, haber yayıncı araçları ve analitik doğrulaması
- [ ] Reklam ve analitik için rıza yönetimi; çerez verilmeden önce izin kontrolü

SEO başlığı üretmek tek başına yeterli değildir. Yayın hızı, özgünlük, teknik erişilebilirlik, doğru kaynaklandırma, temiz bilgi mimarisi ve güçlü iç bağlantı birlikte ele alınacaktır.

## 10. Güvenlik, gizlilik ve operasyon

- [ ] Tüm yazma işlemlerinde sunucu tarafı yetkilendirme, şema doğrulama ve CSRF yaklaşımı
- [ ] HTML temizleme, güvenli embed izin listesi ve Content Security Policy
- [ ] Admin, giriş, kaynak çekme ve medya yükleme uçlarında rate limit
- [ ] Gizli değerlerin yalnızca barındırma secret yönetiminde tutulması
- [ ] KVKK envanteri, açık rıza/çerez tercihleri ve veri saklama politikası
- [ ] Denetim kayıtlarının editörler tarafından değiştirilememesi
- [ ] Günlük otomatik veri yedeği, medya sürümleme ve aylık geri yükleme testi
- [ ] Kritik yayın, giriş, görev ve canlı yayın hataları için alarm
- [ ] Bağımlılık, erişim anahtarı ve kullanıcı yetkilerinin düzenli gözden geçirilmesi
- [ ] Olay müdahale planı tanımlandı; bakım modu ekranı bekliyor

## 11. Test ve kalite kapıları

Her özellik için test senaryosu iş ile birlikte yazılır. Canlıya çıkış kapıları:

- Unit test: veri doğrulama, slug, izin, tarih, SEO ve AI karar kuralları
- Integration test: SQLite/PostgreSQL sorguları, migration, medya metadata, görev kuyruğu ve API yetkileri
- E2E test: giriş, taslak, onay, zamanlama, yayın, geri çekme ve medya yükleme
- Görsel test: ana sayfa, haber, kategori, canlı ve admin; masaüstü/tablet/mobil
- Erişilebilirlik: klavye, odak, landmark, form etiketi, kontrast ve ekran okuyucu akışı
- Performans: Web Vitals, yoğun ana sayfa, görsel yükü ve yavaş ağ
- Güvenlik: yetki atlama, XSS, CSRF, dosya sahteciliği, rate limit ve veri sızıntısı
- Dayanıklılık: veritabanı/nesne depolama hatası, kaynak ve canlı yayın kesintisi, tekrar deneme
- SEO regresyonu: metadata, canonical, schema, sitemap, RSS, robots ve yönlendirmeler

`main` branch'i için asgari otomatik kapı: temiz kurulum, lint, test, build ve migration doğrulaması. Bu kontroller geçmeden canlı dağıtım yapılmamalıdır.

## 12. Ortamlar ve yayınlama

- **Yerel:** Geliştirici verisi; gerçek kullanıcı veya canlı anahtar içermez.
- **Staging:** Üretime benzer veritabanı/medya depolama, test alan adı ve yalnızca ekip erişimi.
- **Production:** Canlı alan adı, ayrı veri kaynakları, sıkı erişim ve alarm kuralları.

Kurulacak dağıtım hattı:

1. Feature branch üzerinde test ve build.
2. Pull request kontrolü ve kod incelemesi.
3. `main` birleşiminde tüm kalite kapılarının tekrar çalışması.
4. Staging migration ve smoke test.
5. Onaylı production migration ve dağıtım.
6. Ana sayfa, haber, API, canlı yayın ve admin sağlık kontrolü.
7. Sorunda önceki çalışan sürüme dönüş; veritabanı için geri uyumlu migration yaklaşımı.

Mevcut repoda doğrulanmış Jenkins veya GitHub Actions hattı yoktur. İlk altyapı işlerinden biri, ekipte kullanılacak CI/CD sağlayıcısını netleştirip bu kapıları gerçekten zorunlu hale getirmektir.

## 13. Aşamalı teslim planı

### Faz 0 — Temeli güvenceye alma

- [x] CI/CD sağlayıcısını seç ve `main` kalite kapılarını kur
- [x] Staging/canlı ortam ayrımını ve alan adlarını tanımla
- [ ] Hata izleme, uptime kontrolü ve secret yönetimini kur (kurgu hazır; araç ve hesap kararı bekliyor)
- [x] Mevcut eski site URL/içerik/medya envanteri çıkarıldı: 7.718 haber adresi, 2020-2026 arası aylık sitemap

**Çıkış kriteri:** Her commit otomatik test edilir; staging güvenli biçimde dağıtılabilir.

### Faz 1 — Tasarım sistemi ve gerçek içerik modeli

- [x] Tasarım token'ları ve ziyaretçi/admin görsel sistemi
- [x] Üretim SQLite şeması ve tekrar çalıştırılabilir seed verisi
- [ ] Haber, kategori, etiket, yazar ve medya okuma API'leri (haber, kategori ve medya tamamlandı)
- [x] Gerçek verili ana sayfa, haber detayı ve kategori sayfası

**Çıkış kriteri:** Ziyaretçi sitesi prototip sabitlerinden değil kalıcı veritabanından çalışır.

### Faz 2 — Güvenli admin ve yayın akışı

- [x] Kimlik doğrulama, roller ve sunucu tarafı izinler
- [ ] Haber editörü, nesne depolama medya yükleme ve önizleme (kalıcı Hetzner medya kütüphanesi ve önizleme tamamlandı; nesne depolama geçişi bekliyor)
- [x] Taslak, inceleme, onay, zamanlama ve yayın durumları
- [ ] Revizyon geçmişi ve audit log (audit log temeli tamamlandı)

**Çıkış kriteri:** Yetkili bir editör haberi güvenle hazırlayıp kontrollü biçimde yayımlayabilir.

### Faz 3 — SEO, taşıma ve medya

- [ ] Haber metadata/schema, sitemap, News sitemap ve RSS
- [x] Eski URL 301 haritası ve içerik taşıma aracı panelden yönetilir (7.718 haber envanteri keşfedildi)
- [ ] Nesne depolama medya hattı, görsel türevleri, telif ve alt metin kontrolleri (alt metin, kredi, dosya doğrulama ve disk kotası tamamlandı)
- [ ] Arama, yazar, video/program ve kurumsal sayfalar

**Çıkış kriteri:** İçerik kaybı olmadan indekslenebilir, hızlı ve eksiksiz yayın deneyimi.

### Faz 4 — AI haber masası

- [ ] Kaynak yönetimi ve zamanlanmış toplama görevleri
- [ ] Tekrar tespiti, kaynaklandırma ve AI öneri üretimi
- [ ] Editör kontrol kuyruğu, red/birleştirme/yayın akışları
- [ ] Kota, güvenlik, telif ve kalite raporları

**Çıkış kriteri:** AI aday üretir; hiçbir aday insan onayı olmadan yayına çıkamaz.

### Faz 5 — Canlı yayın, büyüme ve üretim sertleştirme

- [ ] Gerçek HLS ve yedek yayın entegrasyonu (panel alanları hazır; yayın adresi bekleniyor)
- [ ] Reklam yerleşimleri, rıza yönetimi ve analitik olayları
- [ ] Yük, güvenlik, erişilebilirlik ve geri yükleme tatbikatları
- [ ] Editör eğitimi, operasyon rehberi ve canlıya geçiş kontrol listesi

**Çıkış kriteri:** Canlı trafik, yayın operasyonu ve hata senaryoları için ölçülmüş üretim hazırlığı.

## 14. İlk sıradaki somut işler

1. CI/CD kararını verip test + lint + build kapısını kurmak.
2. Üretim veritabanı şemasını ER diyagramı ve migration'larla hazırlamak.
3. Haber durumu/rol/yetki kurallarını kod seviyesinde tanımlamak.
4. Haber detay, kategori ve yazar detay rotalarını gerçek veriye bağlamak.
5. Admin girişini ve ilk taslak → inceleme → yayın akışını tamamlamak.
6. Nesne depolamayı açıp güvenli görsel yükleme dikey dilimini yapmak.
7. Haber detay SEO/schema, sitemap ve RSS altyapısını eklemek.
8. Eski Koza TV URL ve içerik envanterini çıkarıp taşıma tablosunu hazırlamak.
9. Kaynak toplama için tek bir izinli kaynakla AI haber masası pilotu yapmak.
10. Staging üzerinde uçtan uca editör ve yayın testini tamamlamak.

## 15. Karar kayıtları

Aşağıdaki kararlar uygulama başlamadan veya ilgili faza girerken netleştirilmelidir:

- Yönetim paneli için kullanılacak gerçek kimlik sağlayıcısı ve MFA yöntemi
- Haber kaynaklarının kullanım/telif izinleri ve saklanacak orijinal içerik kapsamı
- Canlı yayın sağlayıcısı, HLS adresi ve yedek yayın yöntemi
- Medya saklama, arşivleme ve silme süreleri
- Reklam ağı, rıza yönetimi ve ölçüm araçları
- Eski CMS/veritabanına erişim ve içerik taşıma formatı
- Jenkins kullanılacaksa job/webhook bilgileri; kullanılmayacaksa alternatif CI/CD sağlayıcısı
- Yayın öncesi tek veya çift editör onayı gereken kategori ve risk seviyeleri

Bu kararlar alındıkça tarih, seçenek, gerekçe ve etkisiyle birlikte bu bölüme eklenmelidir.
