# Koza TV Proje Çalışma Kuralları

Bu dosya Koza TV projesinin ortak çalışma hafızasıdır. İnsan veya yapay zekâ fark etmeksizin projede çalışacak herkes işe başlamadan önce bu dosyanın tamamını okumalıdır.

## ALTIN KURAL — TESTSİZ HİÇBİR İŞ TAMAMLANMIŞ SAYILMAZ

> **Yapılan her değişikliğin test senaryosu yazılacak, test çalıştırılacak ve sonucu çalışma günlüğüne kaydedilecektir. Testsiz kod commit edilemez, push edilemez, yayına alınamaz. “Küçük değişiklik” istisnası yoktur.**

- Her hata düzeltmesi, hatayı önce yakalayan ve düzeltmeden sonra geçen bir regresyon testi içermelidir.
- Her yeni özellik; başarılı kullanım, başarısız kullanım, yetkisiz kullanım ve sınır durum senaryolarına sahip olmalıdır.
- Görsel değişiklikler masaüstü, tablet ve mobil görünümde kontrol edilmelidir.
- Formlar ve etkileşimler klavye, odak, boş değer, hatalı değer, yükleniyor, başarı ve hata durumlarıyla test edilmelidir.
- Test başarısızsa iş bitmiş kabul edilmez. Başarısız test atlanmaz, susturulmaz veya gerekçesiz silinmez.
- Test kapsamı değişiklikle aynı commit içinde yer almalıdır.
- Çalışma günlüğünde çalıştırılan komut, geçen test sayısı ve bilinen eksikler açıkça yazılmalıdır.

## 1. Projenin tek kaynağı

- Çalışma dizini: Her geliştiricinin kendi bilgisayarındaki Git repository köküdür; bu dokümana kişiye veya makineye özel mutlak klasör yolu yazılmaz.
- GitHub: `https://github.com/umtco12/kozawebsite`
- Ana branch: `main`
- Tasarım referansı: `https://kozatv-haber.kozatv.workers.dev/`
- Canlı marka alan adı: `https://www.kozatv.com.tr/`
- Ortak çalışma yalnızca GitHub repository içeriği üzerinden yürütülür.
- Kişisel yedek, arşiv veya bilgisayara özel dizin bilgileri bu ortak dokümana yazılmaz.

## 2. Her çalışmada zorunlu sıra

1. Bu `AGENTS.md` dosyasını tamamen oku.
2. `git status --short --branch` ile branch ve değişiklikleri kontrol et.
3. Kullanıcının mevcut değişikliklerini silme, üzerine yazma veya habersizce commit kapsamına alma.
4. İstenen işi küçük, anlaşılır ve geri alınabilir değişikliklerle gerçekleştir.
5. Değişiklik için test senaryolarını yaz veya mevcut testleri genişlet.
6. `npm test` çalıştır; tek bir başarısız test varsa işi tamamlanmış sayma.
7. En az `npm run build` çalıştır ve sonucu doğrula.
8. Değiştirilen sayfalar için gerekli rota/API ve tarayıcı kontrollerini yap.
9. Bu dosyanın **Çalışma Günlüğü** bölümüne yapılan işi, değişen ana dosyaları ve doğrulama sonucunu ekle.
10. Yalnızca ilgili dosyaları seçerek stage et. `git add .` ve `git add -A` kullanma.
11. Commit veya push işlemini yalnızca kullanıcı açıkça istediğinde yap.

## 3. Dosya ve klasör düzeni

- Aktif uygulama kodu yalnızca bu GitHub projesinde tutulur.
- `report/`, `backup/`, müşteri teklifleri, PDF'ler ve eski HTML tasarımları aktif repoya eklenmez.
- Haber sitesi kodu `app/`, statik medya `public/`, veri erişimi `db/` ve Hetzner yayın dosyaları `deployment/hetzner/` altında tutulur.
- Şifre, API anahtarı, erişim anahtarı veya kişisel veri Git'e yazılmaz.
- Derleme çıktıları ve yerel bağımlılıklar commit edilmez.

## 4. Tasarım yaklaşımı

- Görsel yön, referans sitedeki kurumsal haber merkezi yaklaşımıdır.
- Koza TV ulusal bir haber markası olarak ele alınır; içerik ve tasarım tek bir şehirle sınırlandırılmaz.
- Öncelikler: güçlü manşet, son dakika görünürlüğü, canlı yayın, video, yazarlar, reklam alanları ve mobil okunabilirlik.
- Tasarım masaüstü, tablet ve mobilde çalışmalıdır.
- Klavye odağı, kontrast, azaltılmış hareket tercihi ve anlamlı alternatif metinler korunmalıdır.

## 5. SEO ve yayın kuralları

- Canonical alan adı `https://www.kozatv.com.tr` olarak kabul edilir.
- Sayfa başlığı, açıklama, Open Graph ve X/Twitter alanları gerçek içeriği yansıtmalıdır.
- Haber detaylarında benzersiz metadata, haber görseli ve yapılandırılmış veri kullanılmalıdır.
- Eski haber URL'leri taşıma sırasında korunmalı veya birebir 301 yönlendirmesi yapılmalıdır.
- Yapay zekâ tarafından hazırlanan hiçbir haber editör onayı olmadan yayınlanmamalıdır.

## 6. Admin paneli ve içerik güvenliği

- Admin paneli anonim kullanıcılara açık bırakılmaz.
- Roller en az yönetici, yayın yönetmeni, editör, muhabir ve sadece görüntüleme olarak ayrılır.
- Yapay zekâ haberleri önce taslak kuyruğuna gelir; kaynak, telif, görsel ve doğrulama kontrollerinden sonra editör yayınlar veya zamanlar.
- Her yayınlama, güncelleme ve silme işlemi denetim kaydına yazılmalıdır.
- Harici haber kaynağı ekleme ve otomatik içerik çekme yalnızca yetkili kullanıcılar tarafından yapılabilir.

## 7. Git çalışma şekli

- `main` her zaman çalışır durumda tutulur.
- Geliştirme için kısa ve açıklayıcı feature branch kullanılır.
- Commit mesajı yapılan işi açıkça anlatır.
- Bir commit yalnızca ilgili işin dosyalarını içermelidir.
- Push öncesinde diff, build sonucu ve çalışma günlüğü tekrar kontrol edilir.
- Başka kişilerin değişiklikleri izinsiz geri alınmaz veya yeniden yazılmaz.

## 7.1 Hetzner üretim altyapısı

- Üretim hedefi Debian 13 üzerinde Node.js 22 standalone servisidir.
- Uygulama `kozatv` sistem kullanıcısı ile yalnızca `127.0.0.1:8201` adresinde çalışır; dış trafik Caddy üzerinden gelir.
- Kalıcı SQLite verisi kod sürümlerinden ayrı `/srv/kozatv/data/` dizininde tutulur.
- Admin kimlik doğrulaması tamamlanıncaya kadar `/admin` ve içerik yazma istekleri Caddy katmanında dış erişime kapalı kalır.
- Sunucu, hesap, SSH, veritabanı veya üçüncü taraf servis parolaları hiçbir dosyaya ya da Git geçmişine yazılmaz.
- DNS geçişi tamamlanmadan eski alan adı yayınının kapandığı varsayılmaz; IP ve alan adı ayrı ayrı test edilir.

## 8. Koza TV zorunlu test matrisi

Her işte yalnızca değişiklikten etkilenen senaryolar değil, kritik yayın akışı regresyonları da düşünülmelidir.

### Genel ziyaretçi sitesi

- Ana sayfa, kategori, haber detayı, arama, yazarlar, video ve canlı yayın rotaları.
- Header, menü, son dakika bandı, manşet slider, haber kartları ve footer bağlantıları.
- Boş içerik, eksik görsel, uzun başlık, Türkçe karakter ve yoğun son dakika akışı.
- Masaüstü, tablet ve mobil kırılımları; yatay taşma ve okunabilirlik.

### Haber ve medya

- Haber başlığı, özet, gövde, yazar, yayın/güncelleme tarihi, kategori ve etiketler.
- Görsel/video yükleme, alternatif metin, kırık medya, farklı en-boy oranları ve telif alanları.
- Video oynatma, canlı yayın erişimi, yayın kesintisi ve yedek yayın mesajı.

### Admin ve editör akışı

- Giriş, çıkış, oturum süresi, yetkisiz erişim ve rol bazlı izinler.
- Taslak oluşturma, düzenleme, önizleme, editör onayı, zamanlama, yayınlama ve geri çekme.
- Eş zamanlı düzenleme, kaydetme hatası, bağlantı kesintisi ve denetim kaydı.
- Yönetici, yayın yönetmeni, editör, muhabir ve görüntüleyici rollerinin ayrı testleri.

### Yapay zekâ haber masası

- Kaynak URL ekleme, kaynağı çekme, tekrar haber tespiti ve kaynak erişim hatası.
- AI özet/başlık üretimi, yanlış veya eksik sonuç, kaynak gösterimi ve editör reddi.
- AI içeriğinin editör onayı olmadan yayınlanamadığının testi.
- Görsel/video aktarımı, telif uyarısı, zamanlama ve işlem günlüğü.

### SEO, erişilebilirlik ve performans

- Benzersiz title/description, canonical, Open Graph, X/Twitter ve haber yapılandırılmış verisi.
- Sitemap, RSS, robots, eski URL yönlendirmeleri ve 404 davranışı.
- Klavye kullanımı, görünür odak, kontrast, alternatif metin ve azaltılmış hareket.
- LCP, CLS ve INP bütçeleri; görsel boyutları, önbellek ve yavaş bağlantı davranışı.

### Güvenlik ve veri

- Admin/API yetkilendirmesi, istek doğrulama, rate limit ve CSRF yaklaşımı.
- XSS, zararlı HTML, uygunsuz dosya yükleme ve hassas veri sızıntısı kontrolleri.
- Veritabanı yedeği, geri yükleme, içerik taşıma ve tekrar çalıştırılabilir migration testleri.

## 9. Tamamlanmış sayılma kriteri

Bir iş ancak aşağıdakiler tamamlandığında bitmiş kabul edilir:

- İstenen davranış uygulanmıştır.
- Değişikliğin otomatik test senaryoları yazılmış ve tamamı geçmiştir.
- Proje başarıyla derlenmiştir.
- İlgili rota veya API kontrol edilmiştir.
- Mobil ve erişilebilirlik etkisi değerlendirilmiştir.
- Bu dosyadaki çalışma günlüğü güncellenmiştir.
- Kullanıcıya ne yapıldığı ve varsa kalan kararlar açıkça bildirilmiştir.

## 10. Çalışma Günlüğü

### 2026-08-20 — GitHub proje kurulumu ve ilk iyileştirmeler

- `umtco12/kozawebsite` deposunun `main` branch'i ortak projenin tek kaynak noktası olarak belirlendi.
- Ana sayfadaki sabit tarih İstanbul saat dilimine göre dinamik hale getirildi.
- SEO metadata temeli düzenlendi; canonical taban alan adı, Open Graph ve X/Twitter paylaşım görseli tanımlandı.
- Haber kartlarına hafif etkileşim, klavye odak görünümü ve azaltılmış hareket desteği eklendi.
- Ana sayfa, `/admin` ve `/api/content` başarılı yanıt verdi.
- `npm run build` başarılı tamamlandı.

### 2026-08-20 — Altın test kuralı ve Koza TV regresyon paketi

- İstek: Yapılan her iş için test senaryosu yazılması, testin zorunlu hale getirilmesi ve uygulamanın yerelde ayrıntılı kontrol edilmesi.
- Yapılanlar: Bu dosyanın başına testsiz işin tamamlanamayacağını belirten **ALTIN KURAL** eklendi; Koza TV ziyaretçi sitesi, haber/medya, admin, AI haber masası, SEO, erişilebilirlik, performans, güvenlik ve veri başlıklarında zorunlu test matrisi tanımlandı.
- Değişen ana dosyalar: `AGENTS.md`, `tests/rendered-html.test.mjs`, `app/api/content/content-model.mjs`, `app/api/content/route.ts`, `app/admin/page.tsx`, `app/site-client.tsx`, `app/yazarlar/page.tsx`, `app/page.tsx`, `app/globals.css`.
- Otomatik doğrulama: `npm test` ile build ve 10 regresyon senaryosu çalıştı; **10 geçti, 0 başarısız, 0 atlandı**.
- Kod kalitesi: `npm run lint` tamamlandı; **0 hata**, mevcut `<img>` kullanımları için **9 performans uyarısı** bulunuyor.
- Tarayıcı doğrulaması: 1440 px masaüstünde yatay taşma yok; 390 px mobilde yatay taşma yok; mobil menü açıldı ve 9 bağlantı gösterdi; canlı yayın sayfasına geçiş ve geri dönüş çalıştı; admin panelinde 8 bölüm düğmesi, kayıt düğmesi ve yazar düzenleme alanları göründü; konsolda hata oluşmadı.
- API doğrulaması: Yerel `/api/content` isteği HTTP 200 döndürdü; 3 manşet ve 4 yazar kaydı doğrulandı.
- Kalan karar veya risk: Admin kimlik doğrulaması ve rol yetkilendirmesi henüz uygulanmadı; gerçek canlı yayın oynatıcısı henüz bağlı değil; bazı kategori/kurumsal bağlantılar gerçek sayfalara bağlanmadı; Next Image dönüşümüyle kapatılacak 9 görsel performans uyarısı var.

### 2026-08-20 — Ortak dokümanın makineden bağımsız hale getirilmesi

- İstek: İki geliştiricinin farklı bilgisayarlarında çalışacağı dikkate alınarak ortak dokümandan kişisel klasör ve yerel arşiv bilgilerinin kaldırılması.
- Yapılanlar: Makineye özel mutlak çalışma yolu ve yerel yedek/arşiv konumu kaldırıldı; çalışma dizini repository kökü olarak tanımlandı.
- Değişen ana dosyalar: `AGENTS.md`, `tests/rendered-html.test.mjs`.
- Doğrulama: Ortak dokümanda mutlak kullanıcı yolu ve makineye özel yedek klasör adı bulunmadığını kontrol eden regresyon testi eklendi.
- Kalan karar veya risk: Yok.

### 2026-08-20 — Canlı haber platformu yol haritası

- İstek: Koza TV'yi gerçek verisi, yönetim paneli, medya, yapay zekâ haber masası, SEO, güvenlik ve canlı yayın operasyonu olan uçtan uca bir projeye dönüştürmek; yapılacakları aşamalı bir ortak dokümana bağlamak.
- Yapılanlar: Mevcut prototip ile üretim hedefi ayrıştırıldı; hedef mimari, D1/R2 veri sahipliği, üretim veri modeli, ziyaretçi sayfaları, editoryal akış, AI kaynak toplama, medya, SEO, güvenlik, test, ortamlar ve beş fazlı teslim planı `YAPILACAKLAR.md` dosyasında tanımlandı.
- Değişen ana dosyalar: `YAPILACAKLAR.md`, `AGENTS.md`, `tests/rendered-html.test.mjs`.
- Doğrulama: `npm test` içinde üretim derlemesi ve **12 test geçti; 0 başarısız, 0 atlandı**. `npm run lint` **0 hata** ile tamamlandı; optimize edilecek ham `<img>` kullanımları için mevcut **9 performans uyarısı** devam ediyor. Yol haritasındaki kritik ürün alanlarının ve veri güvenliği ilkelerinin korunmasını kontrol eden regresyon testi eklendi.
- Kalan karar veya risk: Repoda doğrulanmış Jenkins/GitHub Actions hattı bulunmuyor. Kimlik sağlayıcısı, canlı yayın kaynağı, eski CMS erişimi, medya saklama politikası ve CI/CD sağlayıcısı ilgili fazlardan önce netleştirilmelidir.

### 2026-08-20 — Hetzner Debian taşıma temeli

- İstek: Koza TV'yi mevcut Hetzner Debian sunucusuna taşımak, kalıcı veri katmanını hazırlamak, yapılanları belgelemek ve sunucudaki eski Parsel Kontrol yayınını kaldırmak.
- Yapılanlar: Hetzner'deki Debian 13 sunucu kaynakları ve mevcut servisler incelendi. Node.js 22 kuruldu. Uygulama Cloudflare D1/Worker bağımlılığından çıkarılarak standalone Node.js ve WAL modlu SQLite'a geçirildi. Ayrı `kozatv` kullanıcısı, sürüm dizini, kalıcı veri dizini ve sıkılaştırılmış systemd servisi kuruldu. Caddy IP trafiğini Koza TV'ye yönlendirdi; admin ve içerik yazma istekleri gerçek kimlik doğrulama tamamlanana kadar dışarıya kapatıldı. Parsel Kontrol web servisi ve üç zamanlayıcısı durdurulup devre dışı bırakıldı.
- Değişen ana dosyalar: `db/index.ts`, `app/api/content/route.ts`, `next.config.ts`, `vite.config.ts`, `package.json`, `package-lock.json`, `deployment/hetzner/*`, `README.md`, `YAPILACAKLAR.md`, `tests/rendered-html.test.mjs`, `.gitignore`, `AGENTS.md`.
- Doğrulama: Yerel ve Debian sunucuda standalone build başarılı oldu; **14 test geçti, 0 başarısız, 0 atlandı**. Lint **0 hata** ile tamamlandı ve mevcut 9 görsel performans uyarısı kaydedildi. Dış IP üzerinden `/`, `/canli`, `/yazarlar` ve `/api/content` HTTP 200; `/admin` HTTP 404 ve yetkisiz içerik yazma isteği HTTP 403 döndürdü. `kozatv` ve Caddy servisleri aktif doğrulandı.
- Kalan karar veya risk: `kozatv.com.tr` DNS kayıtları halen eski sunucuya yöneliyor ve DNS yönetimi Krihost nameserver'larında. HTTPS ancak DNS geçişinden sonra açılabilir. Hetzner Firewall ve otomatik backup kapalı. Parsel Kontrol servisleri durmuş olsa da dosya, sistem kullanıcısı, günlük ve unit dosyalarının kalıcı silinmesi ayrıca açık kapsam onayı bekliyor. Repodaki bağımlılık denetimi mevcut transitif paketlerde güvenlik bulguları bildiriyor; canlı admin açılmadan önce ele alınmalıdır.

### 2026-08-20 — Main branch'ten Hetzner staging CI/CD

- İstek: `main` branch'ine gelen her commit sonrasında testlerden geçen sürümün `http://46.225.169.52/` staging ortamına otomatik aktarılması.
- Yapılanlar: GitHub Actions üzerinde temiz kurulum, production bağımlılık denetimi, test/build, lint, sabit SSH host anahtarı doğrulaması, sınırlı yetkili `koza-deploy` hesabı, atomik sürüm bağlantısı, iç/dış sağlık kontrolleri ve hata halinde önceki sürüme dönüş akışı hazırlandı. Sunucuda deploy kullanıcısı, root sahipli deploy betiği ve yalnız bu betiğe izin veren dar sudo kuralı kuruldu.
- Değişen ana dosyalar: `.github/workflows/staging.yml`, `deployment/hetzner/deploy.sh`, `deployment/hetzner/known_hosts`, `deployment/hetzner/kozatv-deploy.sudoers`, `deployment/hetzner/README.md`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` ile standalone build ve **14 test geçti; 0 başarısız, 0 atlandı**. `npm run lint` **0 hata** ve mevcut **9 görsel performans uyarısı** ile tamamlandı. `npm audit --omit=dev` **0 production açığı** bildirdi. Workflow YAML ayrıştırıldı; deploy kullanıcısının SSH erişimi, incoming dizinine yazması, geçersiz SHA'yı reddetmesi ve genel sudo komutlarını çalıştıramaması doğrulandı. İlk Actions denemesinde üst dizin grup geçiş yetkisi eksikliği yakalandı; `koza-deploy` yalnız `kozatv` grubuna eklenerek düzeltildi. Sonraki workflow çalışmaları bütün adımlarıyla başarılı oldu; sunucudaki aktif sürümün güncel `main` commit SHA'sına eşit olduğu doğrulandı. Dışarıdan `/`, `/canli`, `/yazarlar` ve `/api/content` HTTP 200; `/admin` HTTP 404 ve yetkisiz içerik yazma isteği HTTP 403 döndürdü.
- Kalan karar veya risk: CI/CD staging hattı çalışır durumda. `main`e her push staging dağıtımını tetikler; bu nedenle `main`e yalnız test edilmiş değişiklik gönderilmelidir. HTTPS, Hetzner Firewall, otomatik yedek ve root SSH girişinin kapatılması ayrı güvenlik işleri olarak devam ediyor.

### 2026-08-20 — Veritabanı destekli tam haber deneyimi ve editör masası

- İstek: Koza TV için elle tutulur, güçlü bir haber sitesi tasarımı; içerik girişinin merkezde olduğu editör paneli, gerçek veritabanı ve kontrollü dış kaynak kurgusu hazırlanması.
- Yapılanlar: Ana sayfa premium editoryal düzende yeniden kuruldu; manşet, son dakika, günün akışı, öne çıkanlar, yazarlar, haber ve video alanları kalıcı SQLite haberlerinden beslenir hale getirildi. Haber/kategori sayfaları, NewsArticle metadata, sitemap, robots ve RSS eklendi. `articles`, `news_sources` ve `audit_logs` tabloları; taslak, inceleme, zamanlama ve yayın durumları; doğrulamalı haber/kaynak API'leri; dashboard, haber arşivi, canlı önizleme, SEO, medya/kaynak alanları ve editör onayı zorunlu AI kuyruğu içeren admin deneyimi hazırlandı. Dış yazma rotaları kimlik doğrulama tamamlanana kadar hem Caddy hem uygulama katmanında kapalı tutuldu.
- Değişen ana dosyalar: `app/page.tsx`, `app/site-client.tsx`, `app/globals.css`, `app/admin/*`, `app/api/articles/*`, `app/api/sources/*`, `app/haber/*`, `app/kategori/*`, `app/sitemap.ts`, `app/robots.ts`, `app/rss.xml/*`, `db/index.ts`, `db/article-model.mjs`, `db/seed.ts`, `deployment/hetzner/Caddyfile.*`, `tests/rendered-html.test.mjs`, `README.md`, `YAPILACAKLAR.md`, `AGENTS.md`.
- Doğrulama: `npm test` içinde production build ve **19 test geçti; 0 başarısız, 0 atlandı**. `npm run lint` **0 hata**, optimize edilecek ham görseller için **17 uyarı** ile tamamlandı. Tarayıcıda ana sayfa 1440, 768 ve 390 px genişliklerde yatay taşma olmadan doğrulandı; kırık görsel bulunmadı. Admin dashboard ve 15 alanlı haber editörü açıldı, konsolda hata görülmedi. İlk staging kontrolünde sunucunun eski Caddy yapılandırmasını kullandığı görülünce uygulama katmanı yazma koruması eklendi ve dış POST istekleri için 403 regresyonu tanımlandı.
- Kalan karar veya risk: Staging `/admin` girişi gerçek kimlik doğrulama/rol sistemi tamamlanana kadar kapalıdır. Medya dosya yükleme ve dönüştürme hattı, dış kaynakları zamanlanmış görevle çekme, AI üretimi, revizyon ekranı ve gerçek analitik verisi sonraki fazlardadır. `<img>` yüzeyleri nesne depolama/CDN kararıyla birlikte optimize edilmelidir.

### 2026-08-20 — Admin kategori merkezi ve kalıcı medya kütüphanesi

- İstek: Tüm haber kategorilerinin admin panelinden yönetilmesi; profesyonel haber sitesi admin düzeni; görsellerin sunucuda nasıl ve ne kadar yer tutacağının güvenli biçimde çözülmesi.
- Yapılanlar: `categories` tablosu, sıralama, görünürlük, vurgu rengi, açıklama ve SEO alanları eklendi. Kategori oluşturma/düzenleme API'si, admin kategori merkezi, veritabanından üretilen masaüstü/mobil menüler, kategori sitemap kayıtları ve gizli kategori davranışı tamamlandı. `media_assets` tablosu ve medya kütüphanesi kuruldu; JPG/PNG/WebP/GIF dosyaları içerik imzasıyla doğrulanıp yıl/ay klasörlerinde SHA-256 tabanlı adla kalıcı veri alanına yazılıyor. Alt metin, fotoğraf kredisi, dosya boyutu ve kullanım URL'si SQLite'ta tutuluyor. Dosya başına 12 MB, toplam 10 GB kota ve diskte en az 1 GB boş alan koruması eklendi. Büyük videolar için dosya yüklemek yerine harici video/HLS URL alanı korunuyor.
- Değişen ana dosyalar: `db/index.ts`, `db/seed.ts`, `db/media-storage.ts`, `app/api/categories/*`, `app/api/media/*`, `app/media/*`, `app/admin/panel.tsx`, `app/page.tsx`, `app/site-client.tsx`, `app/kategori/*`, `app/sitemap.ts`, `app/globals.css`, `deployment/hetzner/*`, `README.md`, `YAPILACAKLAR.md`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` içinde production build ve **21 test geçti; 0 başarısız, 0 atlandı**. Kategori ekleme/gizleme/sıralama, tekrarlı kategori, dış yazma koruması, geçerli/sahte görsel, medya yeniden sunumu, metadata ve kota sınırı test edildi. `npm run lint` **0 hata** ile tamamlandı. Tarayıcıda kategori merkezi ve medya kütüphanesi masaüstünde; kategori merkezi 390 px mobilde yatay taşma ve kırık görsel olmadan doğrulandı; mobil yönetim menüsünün kaydırma çubuğu gizlendi.
- Kalan karar veya risk: Admin kimlik doğrulaması tamamlanana kadar staging'de `/admin` ve yazma rotaları dışarıya kapalıdır. İlk aşamada görseller aynı Hetzner sunucusundaki kalıcı veri diskindedir; trafik ve medya hacmi büyüdüğünde aynı metadata modeli korunarak S3 uyumlu nesne depolama/CDN'e taşınmalıdır. Video dosyaları mevcut sunucu diskine yüklenmemelidir.

### 2026-08-20 — Güvenli admin girişi ve rol sistemi

- İstek: Yönetim panelini kullanıcı girişi ve rol sistemiyle güvenli açmak; proje sahibine yönetici rolü tanımlamak.
- Yapılanlar: Scrypt parola özeti, 12 saatlik hash'lenmiş oturum, `HttpOnly`/`SameSite` çerezi, beş hatalı denemede 15 dakikalık hesap kilidi ve ilk girişte zorunlu parola değişimi eklendi. Yönetici, yayın yönetmeni, editör, muhabir ve görüntüleyici rolleri tüm yönetim API'lerinde sunucu tarafında uygulanır hale getirildi. Yetkisiz `/admin` erişimi girişe yönlendirildi; giriş, parola yenileme ve yöneticiye özel kullanıcı/rol ekranları tasarlandı. İlk yönetici hesabını açık parolayı repoya yazmadan sunucuda oluşturacak araç hazırlandı; Caddy'nin eski toplu engelleri uygulama katmanı yetkilendirmesiyle değiştirildi.
- Değişen ana dosyalar: `db/index.ts`, `db/auth-model.mjs`, `app/api/auth/*`, `app/api/users/*`, `app/api/write-access.ts`, yönetim API rotaları, `app/admin/*`, `app/globals.css`, `scripts/create-admin.mjs`, `deployment/hetzner/Caddyfile.*`, `tests/rendered-html.test.mjs`, `README.md`, `YAPILACAKLAR.md`, `AGENTS.md`.
- Doğrulama: `npm test` içinde production build ve **24 test geçti; 0 başarısız, 0 atlandı**. Güvenli çerez, hatalı giriş, zorunlu parola değişimi, viewer yazma engeli, oturumsuz API erişimi ve admin yönlendirmesi test edildi. `npm run lint` **0 hata**, mevcut ham görseller için **21 performans uyarısı** ile tamamlandı. Giriş ekranı 1440, 768 ve 390 px genişliklerde yatay taşma olmadan; iki etiketli giriş alanı ve görünür klavye odağıyla doğrulandı, konsolda hata görülmedi.
- Kalan karar veya risk: İlk staging denemesinde eski sağlık kontrolünün artık korunan `/api/content` rotasında 200 beklediği görüldü; otomatik geri dönüş kesintiyi engelledi ve sağlık/smoke kontrolleri giriş sayfası, admin yönlendirmesi ve 401 oturum sözleşmesine geçirildi. MFA, IP tabanlı rate limit, hesap pasife alma/rol değiştirme, parola sıfırlama e-postası ve şüpheli giriş alarmı sonraki güvenlik adımlarıdır. Staging IP adresi HTTP çalıştığı için `Secure` çerezi alan adı HTTPS geçişinde etkinleşecektir.

### Yeni günlük kaydı şablonu

### 2026-08-20 — Güvenli yayın stüdyosu, yedekleme ve editoryal onay

- İstek: Stage ortamının canlı alan adı gibi ele alınmaması; SQLite/medya yedeği ve güvenlik; profesyonel blok editörü; muhabirden yayın yönetmenine tam onay akışı.
- Yapılanlar: Blok tabanlı haber editörü, dört saniyelik otomatik taslak kaydı, masaüstü/mobil ön izleme, çoklu görsel, video ve sosyal bağlantı blokları, revizyon geri yükleme, ekip yorumları, görev atama ve eşzamanlı düzenleme sürüm kontrolü eklendi. Muhabir → editör → yayın yönetmeni akışı; değişiklik talebi, ret gerekçesi, yayın onayı, planlama, yayın, yayından kaldırma, düzeltme notu, manşet sırası, son dakika ve 30 günlük operasyon özeti veritabanı/API/UI düzeyinde kuruldu. Yayın öncesi başlık, spot, gövde, görsel alt metni ve kaynak kontrolü sunucuda zorunlu hale getirildi. SQLite ve medya için doğrulamalı günlük/haftalık/aylık yedek, tek komut geri yükleme, aylık geri yükleme testi, disk/servis/veritabanı sağlık timer'ı ve opsiyonel webhook alarmı hazırlandı. Stage sunucusunda anahtarlı `koza-admin` hesabı doğrulandı; root/parola SSH girişi kapatıldı ve UFW yalnız 22/80/443 portlarına indirildi.
- Değişen ana dosyalar: `db/index.ts`, `app/api/editorial/route.ts`, `app/api/articles/route.ts`, `app/admin/panel.tsx`, `app/admin/workflow-studio.tsx`, `app/haber/[slug]/*`, `app/globals.css`, `deployment/hetzner/kozatv-*`, `deployment/hetzner/README.md`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build'i tamamladı; editoryal onay, onaysız yayın engeli, revizyon/yorum/işlem geçmişi, yetkisiz erişim ve gerçek yedek doğrulaması dahil **26 test geçti, 0 başarısız, 0 atlandı**. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için 23 performans uyarısıyla tamamlandı. Sunucuda backup, health ve restore-test servisleri elle çalıştırılıp başarılı sonuç verdi; üç timer etkin. Yeni `koza-admin` oturumu/sudo doğrulandı, root SSH bağlantısı reddedildi ve UFW kuralları 22/80/443 olarak kontrol edildi.
- Kalan karar veya risk: Stage IP adresi HTTP olduğu için yalnız test hesapları kullanılmalıdır; alan adı canlıya alınırken HTTPS zorunlu kapı olacaktır. Harici yedek hedefi ve alarm webhook'u için müşteri hesabı/URL'si henüz verilmedi. Yedekler şu an aynı sunucuda tutulur; gerçek felaket kurtarma için ikinci lokasyon zorunludur.

Her yeni işte aşağıdaki biçimi kullan:

```md
### YYYY-AA-GG — Kısa iş adı

- İstek:
- Yapılanlar:
- Değişen ana dosyalar:
- Doğrulama:
- Kalan karar veya risk:
```
