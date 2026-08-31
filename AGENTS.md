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

### 2026-08-22 — Ziyaretçi sitesinin tıklanabilir hale getirilmesi ve eksik sayfalar

- İstek: Staging sitesinde menüdeki ve alt bölümdeki bağlantıların çalışmaması; "Son Dakika", "Ekonomi" gibi öğelere tıklanınca hiçbir şey olmaması; kategori oluşturma akışının netleştirilmesi; siteyi kullanılabilir hale getirip ayrıntılı test edilmesi ve yönetim panelinin gözden geçirilmesi.
- Yapılanlar: Ortak `SiteHeader`/`SiteFooter` bileşeni eklendi; ana sayfa, kategori, haber detayı, canlı yayın, yazarlar ve yeni sayfalar aynı çalışan menüyü kullanıyor. Boş çapa bağlantıları (`#gundem`, `#sondakika`, `#video`) ve tıklanamayan `span`/`button` öğeleri gerçek sayfalara bağlandı. Yeni rotalar: `/son-dakika`, `/arama`, `/videolar`, `/yazar/[slug]`, `/kurumsal/[slug]` (hakkımızda, künye, yayın ilkeleri, iletişim, KVKK, gizlilik, çerez) ve özel 404 ekranı. Menüye tarayıcının kendi GET gönderimiyle çalışan arama alanı eklendi; JavaScript yüklenmese de çalışır. Yazarlar sayfası sabit listeden veritabanı imzalarına geçirildi; her imza için haber arşivi ve `Person` yapılandırılmış verisi üretiliyor. Haber detayına gerçek paylaşım bağlantıları, bağlantı kopyalama, yazar bağlantısı, etiketler, video bloğu ve `BreadcrumbList` eklendi. Canlı yayın sayfası yayın akışı, kanal bilgileri ve gerçek oynatıcıya hazır bileşenle yenilendi; yayın kaynağı tanımsızken sahte yayın gösterilmiyor. Bulunamayan haber/kategori/yazar/kurumsal adresler artık 404 döndürüyor ve indekslenmiyor. Sitemap yeni rotaları, robots ise arama sayfasını kapsıyor. Yönetim panelinde kullanıcı rolü değiştirme ve pasife alma tamamlandı; son aktif yöneticinin düşürülmesi ve kişinin kendi hesabını kapatması engellendi, işlemler denetim kaydına yazılıyor. Kullanılmayan eski `.subpage`/`.live-page` stilleri kaldırıldı (canlı yayın sayfasındaki hizalama bozukluğunun kaynağıydı).
- Kök neden (tıklanamama): Bağlantıların `href` değerleri doğruydu; sorun `next/link` bileşeninin tıklamayı yakalayıp vinext beta istemci yönlendiricisinin gezinmeyi tamamlayamamasıydı (tarayıcı konsolunda `RSC prefetch setup error: f is not a function`). Bu nedenle menü, haber kartları ve yönetim paneli bağlantıları hiçbir şey yapmıyordu. Ziyaretçi sitesi ve yönetim panelindeki 74 bağlantı, tarayıcının kendi gezinmesini kullanan sade `<a href>` etiketlerine çevrildi; `@next/next/no-html-link-for-pages` kuralı gerekçesi yazılarak kapatıldı ve `next/link` kullanımını yasaklayan regresyon testi eklendi.
- Değişen ana dosyalar: `app/site-chrome.tsx`, `app/site-config.ts`, `eslint.config.mjs`, `app/site-client.tsx`, `app/page.tsx`, `app/son-dakika/page.tsx`, `app/arama/page.tsx`, `app/videolar/page.tsx`, `app/yazarlar/page.tsx`, `app/yazar/[slug]/page.tsx`, `app/kurumsal/[slug]/page.tsx`, `app/not-found.tsx`, `app/canli/page.tsx`, `app/canli/live-player.tsx`, `app/haber/[slug]/page.tsx`, `app/haber/[slug]/share-buttons.tsx`, `app/kategori/[slug]/page.tsx`, `app/admin/panel.tsx`, `app/api/users/route.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/globals.css`, `db/index.ts`, `scripts/test-onizleme.sh`, `tests/rendered-html.test.mjs`.
- Doğrulama: `npm test` içinde üretim derlemesi ve **35 test geçti; 0 başarısız, 0 atlandı** (önceki 26 testin tamamı korundu, 9 yeni senaryo eklendi). Yeni testler: sekiz sayfadaki bütün iç bağlantıların gerçek sayfaya gitmesi (33 ayrı adres, 0 kırık), son dakika akışı, arama sonucu/boş sonuç/kısa terim/HTML enjeksiyonu, video merkezi, yedi kurumsal sayfa ve noindex davranışı, yazar arşivi ve bilinmeyen imza, özel 404 + robots + sitemap, yeni yayınlanan haberin arama/yazar/son dakika/video yüzeylerinde görünmesi, kullanıcı rolü değiştirme ve pasife alma korumaları, gezinme bağlantılarının `next/link`'e bağlı olmaması. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, ham `<img>` yüzeyleri için **28 performans uyarısı** ile tamamlandı. Tarayıcı doğrulaması: 1440 px masaüstünde ana sayfa, son dakika, canlı yayın, yazarlar, arama ve kurumsal sayfa; 390 px mobilde yatay taşma yok (`scrollWidth == innerWidth`), mobil menü 16 bağlantıyla açıldı, menü araması açılıp `/arama?q=` adresine gitti. Gerçek fare tıklamasıyla menüdeki **Gündem**, **Son Dakika** ve haber kartı bağlantıları doğru sayfaları açtı; konsoldaki `RSC prefetch setup error` kayboldu.
- Kalan karar veya risk: Sosyal medya hesap adresleri, web canlı yayın HLS adresi ve künye/iletişim kurumsal bilgileri müşteri tarafından verilmedi; `app/site-config.ts` içinde boş bırakıldı ve boş oldukları sürece bağlantı olarak gösterilmiyor. Video merkezi haber editöründeki **Video URL** alanına bağlıdır; alan boşken sayfa yönlendirici boş durum gösterir. Depoda `vinext@1.0.0-beta.2` kullanılıyor; `1.0.0-beta.8` mevcut. Sürüm yükseltildiğinde `next/link` davranışı yeniden ölçülüp istemci tarafı geçişlere dönülüp dönülmeyeceğine karar verilmelidir. Üst bilgi bandındaki döviz kurları `api.frankfurter.app` isteği başarısız olduğunda kod içindeki sabit değerleri (41,12 / 48,06 / 55,74) gösteriyor; haber sitesinde yanlış veri riski taşıdığı için sunucu tarafı önbellekli bir kaynağa taşınmalı veya istek başarısızsa gösterim kaldırılmalıdır. Değişiklikler kullanıcı isteğiyle commit edilmedi; `main` push'u staging dağıtımını tetiklediği için yayın onayı bekliyor.

### 2026-08-22 — Panelden yönetilen site ayarları, adres eşlemesi ve gerçek piyasa verisi

- İstek: Yayınlanan işin staging'e dağıtılması; kalan işlerin mümkün olduğunca yönetim panelinden yönetilebilir hale getirilmesi (canlı yayın adresi, sosyal hesaplar, künye/iletişim bilgileri, eski site adres envanteri); yapılandırma ve güvenlik yerine ürün tarafına odaklanılması; döviz göstergesinin çözülmesi; AI haber masasının beklemesi; operasyon için kurgu hazırlanması.
- Yapılanlar: Önceki iş `main`'e alınıp staging'e dağıtıldı ve dış IP üzerinden bütün yeni rotalar doğrulandı. `site_settings` ve `redirects` tabloları eklendi; alan tanımı, doğrulama ve varsayılanlar `db/settings-model.mjs` içinde toplandı. Yönetim paneline **Site Ayarları** sekmesi eklendi: canlı yayın HLS adresi, yedek yayın adresi, uydu/platform bilgisi, dört sosyal hesap, ticari unvan, sorumlu müdür, haber koordinatörü, adres, telefon, üç e-posta ve düzenlenebilir yayın akışı. Ziyaretçi sitesi bu değerleri okur; sosyal hesap boşsa bağlantı üretilmez, canlı yayın adresi boşsa oynatıcı yerine kesinti ekranı gösterilir. Ana kaynak açılmazsa oynatıcı tanımlı yedek kaynağa geçer. Yönetim paneline **Adres Yönetimi** sekmesi eklendi: tek tek veya toplu envanter yapıştırarak eski adres → yeni adres eşlemesi, kalıcı/geçici tür, kullanım sayacı, durdurma/silme ve hedef adreslerin gerçekten açıldığını doğrulayan kontrol. Eşleme bulunan adres kalıcı yönlendirme ile yeni adrese gider; büyük/küçük harf, sondaki eğik çizgi, sorgu ve tam URL farkları tek biçime indirilir. Var olan `/haber`, `/kategori`, `/yazar` ve `/kurumsal` rotaları da kendi 404'lerinden önce eşleme tablosuna bakar. Üst bilgi bandındaki döviz kuru artık koda gömülü sabit değer değil: TCMB günlük bülteninden sunucu tarafında okunuyor, 15 dakika önbelleğe alınıyor, kaynak ve bülten tarihi birlikte gösteriliyor; veri alınamazsa gösterge hiç çizilmiyor. Hava durumu da aynı uçtan sunucu tarafında geliyor, böylece tarayıcıdan üçüncü tarafa istek gitmiyor. Operasyon kurgusu `deployment/OPERASYON.md` içinde tanımlandı: izlenecek sinyaller ve eşikler, P1/P2/P3 alarm seviyeleri, nöbet sorumlulukları, olay müdahale akışı, RPO/RTO hedefleri, bakım penceresi ve canlıya geçiş kontrol listesi.
- Değişen ana dosyalar: `db/settings-model.mjs`, `db/index.ts`, `app/api/settings/route.ts`, `app/api/redirects/route.ts`, `app/api/piyasa/route.ts`, `app/admin/site-settings.tsx`, `app/admin/redirects.tsx`, `app/admin/panel.tsx`, `app/site-config.ts`, `app/site-chrome.tsx`, `app/site-client.tsx`, `app/legacy-redirect.ts`, `app/[...eskiAdres]/page.tsx`, `app/canli/page.tsx`, `app/canli/live-player.tsx`, `app/kurumsal/[slug]/page.tsx`, `app/haber/[slug]/page.tsx`, `app/kategori/[slug]/page.tsx`, `app/yazar/[slug]/page.tsx`, `app/sitemap.ts`, `app/globals.css`, `deployment/OPERASYON.md`, `tests/rendered-html.test.mjs`.
- Doğrulama: `npm test` içinde üretim derlemesi ve **41 test geçti; 0 başarısız, 0 atlandı** (önceki 35 senaryo korundu, 6 yeni senaryo eklendi). Yeni testler: ayar modelinin adres/e-posta/yayın akışı doğrulaması, yönlendirme modelinin yol normalleştirmesi ve korumalı yol reddi, panelden kaydedilen ayarların canlı yayın/künye/iletişim/ana sayfa yüzeylerine yansıması, oturumsuz ayar değişikliğinin reddi, eski adreslerin kalıcı yönlendirmesi (haber yolu dahil), toplu envanter aktarımı, hedef kontrolü, kullanım sayacı, durdurma sonrası 404, piyasa ucunun Türkçe biçimli TCMB verisi döndürmesi ve koddan sabit kur değerlerinin kalkması, operasyon kurgusunun kritik bölümleri. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için 28 uyarı. Tarayıcı doğrulaması: yönetim panelinde 10 bölüm listelendi, Site Ayarları formu dört grup ve 35 alanla açıldı, panelden girilen yayın adresi ve X hesabı kaydedildikten sonra `/canli` ve ana sayfada göründü; Adres Yönetimi ekranından toplu envanter aktarıldı ve tablo güncellendi. `/api/piyasa` gerçek TCMB verisi döndürdü (21.08.2026 bülteni; USD 47,97 · EUR 56,12 · GBP 65,60).
- Toplu envanter aktarımında bulunan hata: boşluk içeren serbest metin satırı (örn. "bozuk satır") iki parçaya bölünüp geçerli bir eşleme gibi kaydediliyordu. Artık her iki parçanın da yol veya tam adres görünmesi zorunlu; sessiz yanlış kayıt regresyon testiyle kapatıldı.
- Kalan karar veya risk: Canlı yayın HLS adresi, sosyal hesaplar ve künye/iletişim bilgileri artık kod değişikliği gerektirmiyor; yöneticinin panelden girmesi yeterli. Eski site adres envanteri müşteri tarafından verildiğinde Adres Yönetimi ekranından aktarılacak. Operasyon kurgusu doküman düzeyindedir: hata izleme aracı, dış uptime kontrolü ve alarm kanalı hesap/karar bekliyor; yedekler hâlâ tek sunucuda olduğu için ikinci lokasyon canlıya geçişten önce zorunludur. AI haber masası istek üzerine bekletildi. `vinext` beta.2 → beta.8 yükseltmesi ayrı iş olarak duruyor.

### 2026-08-24 — Eski kozatv.com.tr arşivinin yeni siteye aktarımı

- İstek: `https://www.kozatv.com.tr/` üzerindeki tüm içeriğin yeni Koza TV'ye taşınması; yeni site canlıya alınana kadar içeriği web sitesinden alacak bir köprü kurulması.
- Keşif: Eski site WordPress değil; nginx üzerinde özel bir yapı. Sitemap dizini aylık dosyalara ayrılıyor (`haberler-YYYY-M.xml`) ve toplam **7.718 haber adresi** içeriyor (2020–2026). Her haber sayfasında tam `NewsArticle` JSON-LD var: başlık, açıklama, kategori (`articleSection`), yazar, görsel, yayın/güncelleme tarihi. **Kritik bulgu:** JSON-LD içindeki `articleBody` yaklaşık 500 karakterde kesiliyor (wordCount 114–1488 diyor), bu yüzden tam metin sayfadaki `class="detay"` konteynerinden okunuyor; paragraflar ve ara başlıklar korunuyor. Görseller `/images/haber/` altında ve erişilebilir. Aktarım, sitenin kendi yayımladığı sitemap envanteri üzerinden yürüyor; `robots.txt` içinde tarayıcılara kapalı olan `/arsiv` ve `/ara` yolları kullanılmıyor.
- Yapılanlar: `db/import-model.mjs` içinde ağ erişimi olmadan test edilebilen ayrıştırma katmanı kuruldu: sitemap okuma, JSON-LD çıkarma, tam gövde ve ara başlık ayrıştırma, eski adresten sabit slug üretme, alan adı izin listesi. `import_items` tablosu ile keşfedilen adresler, durum ve hata mesajları veritabanında tutuluyor; keşif ve aktarım tekrar çalıştırılabilir, mükerrer kayıt üretmiyor. `app/api/import/route.ts` üç işlem sunuyor: `discover` (sitemap taraması), `run` (parti parti aktarım), `retry` (hatalıları kuyruğa alma). Aktarımda kategori sitede yoksa menüde gizli olarak açılıyor, kapak görseli medya kütüphanesine indiriliyor (eski sitenin ayakta kalmasına bağımlılık kalmıyor), özgün yayın tarihi korunuyor ve eski adres yeni habere kalıcı olarak yönlendiriliyor. Yönetim paneline **İçerik Aktarımı** sekmesi eklendi: sayaçlar, ilerleme çubuğu, tek parti veya kuyruk boşalana kadar sürekli aktarım, durdurma, parti büyüklüğü, taslak/yayında seçeneği ve son işlem kaydı. Sunucu tarafında serbest adres çekmeyi (SSRF) engellemek için yalnızca `kozatv.com.tr` ve `www.kozatv.com.tr` adreslerinden veri alınıyor; istekler 250 ms aralıkla ve zaman aşımıyla yapılıyor.
- Değişen ana dosyalar: `db/import-model.mjs`, `db/index.ts`, `app/api/import/route.ts`, `app/admin/content-import.tsx`, `app/admin/panel.tsx`, `app/globals.css`, `tests/fixtures/eski-haber.html`, `tests/rendered-html.test.mjs`.
- Doğrulama: `npm test` içinde üretim derlemesi ve **45 test geçti; 0 başarısız, 0 atlandı** (önceki 41 senaryo korundu, 4 yeni senaryo eklendi). Yeni testler: alan adı izin listesi (dış alan adı, iç ağ adresi, `file://` ve benzer görünen alan adı reddi), sitemap ayrıştırma, eski adresten slug/yol üretimi, sabit örnek sayfadan tam gövde ve ara başlık çıkarımı, yorum bölümünün ve arayüz etiketlerinin gövdeye girmemesi, gövde konteyneri yoksa haberin atlanması, aktarım ucunda oturumsuz erişimin ve geçersiz işlemin reddi. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**. Gerçek aktarım denemesi: 33 sitemap tarandı, 7.718 adres kuyruğa alındı; 18 haber gerçek veriyle aktarıldı. Aktarılan haber sayfasında başlık, kategori (Siyaset), yazar, 6 paragraf, iki ara başlık (`KOLTUĞUNA GERİ DÖNDÜ`, `NE OLMUŞTU?`), özgün tarih (24 Ağustos 2026 12:29) ve indirilen WebP kapak görseli doğrulandı. Eski adres `haber-...-9715.html` yeni habere kalıcı yönlendirme verdi. Gövde uzunlukları 1.023–7.803 karakter (ortalama 3.139); 8/8 görsel indi; hiçbir gövdeye arayüz metni sızmadı. Keşif ikinci kez çalıştırıldığında 0 yeni kayıt eklendi ve mükerrer haber oluşmadı. Ölçülen hız haber başına ~0,5 saniye; 7.718 haber için tahmini süre ~64 dakika.
- Yolda bulunan hata: Arayüz etiketlerini gövdeden ayıklayan filtre `\b` sözcük sınırı kullandığı için Türkçe `ş` harfiyle biten "Paylaş" satırı elenmiyordu. Filtre satırın tamamını karşılaştıracak biçimde düzeltildi ve regresyon testiyle kapatıldı.
- Kalan karar veya risk: Aktarım varsayılan olarak **taslak** üretir; arşivin sitede hemen görünmesi için panelde "Doğrudan yayında aktar" açılmalıdır. 7.718 haberin tamamı aktarıldığında medya kütüphanesi ölçülen ortalamayla yaklaşık 6–7 GB yer tutacaktır; mevcut 10 GB kota ve tek sunucu diski göz önüne alındığında nesne depolamaya geçiş bu aktarımdan önce değerlendirilmelidir. Eski sitede tarayıcılara kapalı `/arsiv` bölümünde sitemap dışında içerik varsa ayrıca ele alınmalıdır. Eski sitenin künyesinde bulunan resmî X hesabı `twitter.com/kozatv01` Site Ayarları ekranına girilebilir. Eski site ayrıca `googlenews.xml` ve `/rss` yayınlıyor; Google News sitemap işinde referans alınabilir.

### 2026-08-24 — YouTube canlı yayın desteği, tam arşiv aktarımı ve sunucu taşıma hazırlığı

- İstek: Canlı yayın işinin bitirilmesi ve YouTube'un birinci sıraya alınması; eski sitedeki tüm içeriğin aktarılmasının gerçek ölçekte görülmesi; başka bir sunucuya taşınma durumunda ne yapılacağının düşünülmesi.
- Kök tespit: Eski sitenin canlı yayın sayfası (`/canli-tv`) yalnızca bir YouTube gömme etiketi içeriyor; kanal web yayınını YouTube üzerinden veriyor. Ancak sayfaya gömülü video kimliği (`fJpho27H7Mk`) YouTube'da artık bulunmuyor (oEmbed 404), yani eski sitedeki canlı yayın sayfası ölü bir video gösteriyor. Kanal kimliği `UC4Ohyy56H4EZAy0Pagsv3iA` olarak tespit edildi; kanal kimliğiyle gömme yapıldığında yayın yeniden başlasa ve video kimliği değişse bile adres güncellemek gerekmiyor.
- Yapılanlar: Canlı yayın kaynağı alanı yalnızca HLS kabul etmekten çıkarılıp `parseLiveSource` ile YouTube bağlantısı (`watch?v=`, `youtu.be`, `embed`, `live`, `channel/UC…`) ve HLS (`.m3u8`) adresini ayırt eden bir kaynak alanına dönüştürüldü. Oynatıcı kaynağa göre gömülü YouTube oynatıcısı veya video etiketi kuruyor; kaynak tanımsız ya da geçersizken sahte yayın göstermeyip kesinti ekranı veriyor. Kullanıcı adı biçimi (`@KozaTv`) gömülemediği için açık gerekçeli hata mesajı gösteriliyor. Yedek kaynak da aynı kuralı kullanıyor. Ayar doğrulaması geçersiz kaynağı kaydetmiyor. Sunucu taşımayı kolaylaştırmak için dağıtım hattındaki 10 yerde koda gömülü sunucu adresi `vars.KOZA_HOST` deposu değişkenine bağlandı; `deployment/TASIMA.md` içinde taşıma rehberi yazıldı.
- Değişen ana dosyalar: `db/settings-model.mjs`, `app/canli/live-player.tsx`, `app/canli/page.tsx`, `app/globals.css`, `.github/workflows/staging.yml`, `deployment/TASIMA.md`, `tests/rendered-html.test.mjs`.
- Doğrulama: `npm test` içinde üretim derlemesi ve **48 test geçti; 0 başarısız, 0 atlandı** (önceki 45 senaryo korundu, 3 yeni senaryo eklendi). Yeni testler: dört YouTube adres biçiminin ve kanal kimliğinin doğru gömme adresine çevrilmesi, HLS adresinin ayırt edilmesi, `javascript:` ve `.mp4` gibi geçersiz kaynakların reddi, kullanıcı adı biçiminin gerekçeli reddi, ayar kaydında aynı kuralın uygulanması, `/canli` sayfasının YouTube kaynağıyla gömülü oynatıcı kurması ve kaynak boşaltıldığında kesinti ekranına dönmesi, taşıma rehberinin ve dağıtım değişkeninin varlığı. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**. Tarayıcıda `/canli` sayfasında YouTube oynatıcısı yüklendi; eski sitedeki video kimliğiyle "Video unavailable" görüldüğü için kimliğin geçersizliği oEmbed ile doğrulandı ve kanal kimliği yaklaşımına geçildi. Tam arşiv aktarımı gerçek veriyle çalıştırıldı: 50'lik partilerle 21 saniyede 50 haber (haber başına ~0,42 sn), ilk 500 haberde 0 hata ve 0 atlanan kayıt.
- Kalan karar veya risk: Eski sitedeki ölü YouTube gömmesi eski site kapatılana kadar orada kalacak; yeni sitede kanal kimliği kullanıldığı için bu sorun tekrarlamaz. Sunucu taşıma artık bir dosya (SQLite) ve bir klasör (medya) kopyalamaya indi; asıl risk sunucu değil DNS geçişi ve kopyalama anındaki yazma boşluğu. Yedekler halen aynı sunucuda; ikinci lokasyon ayrı iş olarak duruyor. Cloudflare önüne alma işi müşterinin hesabı ve Krihost'taki nameserver değişikliğini gerektirdiği için uygulanmadı; mevcut MX (Yandex) ve diğer DNS kayıtlarının önce eksiksiz taşınması zorunludur.

### 2026-08-24 — Aktarım görsel hatası, başlık okunabilirliği ve ana sayfa/bölüm tasarımı

- İstek: Aktarılan haberlerde hep aynı görselin çıkması; ana sayfanın ve kategori/son dakika sayfalarının tasarımının beğenilmemesi, tasarım açısından örnek alınacak bir site istenmesi.
- Kök neden (aynı görsel): Aktarımda kapak görseli indirilemeyen haberlere yedek olarak `/news/gundem.jpg` yazılıyordu; bu dosya tohum verisindeki gerçek bir stüdyo karesi ("HÜSEYİN CAN GÜNER ADLİYEYE SEVK EDİLDİ"). Görseli olmayan her habere gerçek bir haber fotoğrafı gibi görünen aynı kare konuyordu. Veri incelendiğinde 7.712 haberde 7.380 farklı görsel bulunduğu, sorunun 216 haberlik yedek kümede olduğu görüldü. Bu haberlerin eski sitede de kapak görseli yok: `og:image`, `twitter:image` ve JSON-LD alanlarının üçü de dosya adı içermeyen `".../images/haber/"` klasör yolunu veriyor.
- Yapılanlar (görsel): Tarafsız `public/news/gorsel-yok.svg` yer tutucusu eklendi; "Bu haberde görsel bulunmuyor" yazısıyla eksikliği açıkça belirtiyor. Aktarımın yedeği bu dosyaya çevrildi. Görsel adayı seçimi sıkılaştırıldı: adres dosya adı ve görsel uzantısı içermiyorsa aday sayılmıyor, ayrıca `twitter:image` de yedek kaynak olarak deneniyor. Mevcut 216 kayıt tek seferlik migration ile yer tutucuya çevrildi. Aktarım paneline "kapak görseli yok" sayacı eklendi.
- Yapılanlar (tasarım): Arşiv başlıklarının %72'si (5.523/7.712) tamamen büyük harf olduğu için `db/title-model.mjs` eklendi: yalnızca tamamı büyük harf olan başlıklar okunur biçime çevriliyor, kısaltmalar (CHP, TBMM, PKK, UEFA) korunuyor, ekler küçültülüyor ("CHP'NİN" → "CHP'nin"), ilk harf noktalama atlanarak büyütülüyor ("(MAÇ" → "(Maç"). Veri değişmiyor, dönüşüm gösterim anında yapılıyor. Eski sitede `og:description` çoğu haberde başlığın kopyası olduğu için spot başlıkla aynıysa kartta gösterilmiyor; aktarımda da böyle durumlarda gövdenin ilk paragrafı spot olarak alınıyor. Ana sayfa yeniden kuruldu: masthead'deki boş gri reklam kutusu kaldırıldı, akışlar `listLatestArticles` ile tarihe göre sıralandı (arşiv aktarımından sonra demo haberleri öne çıkıyordu), bölümler havuz tükendiğinde boş kalmayacak biçimde sırayla dolduruluyor, kart görselleri 16:9 orana oturtuldu ve tembel yükleniyor. Kategori ve son dakika sayfaları aynı tasarım diline geçirildi: koyu bölüm başlığı, manşet haber, üç sütunlu ızgara, yan sütunda diğer kategoriler ve son dakika listesi. Kategori sayfalarına sayfalama eklendi (`?sayfa=`), böylece yüzlerce haberlik kategorilerde ilk 30 kayıttan sonrası erişilebilir oldu. Son dakika sayfası gün gruplarıyla "dakika dakika" akışına dönüştürüldü.
- Değişen ana dosyalar: `db/title-model.mjs`, `db/import-model.mjs`, `db/index.ts`, `app/api/import/route.ts`, `app/admin/content-import.tsx`, `app/page.tsx`, `app/kategori/[slug]/page.tsx`, `app/son-dakika/page.tsx`, `app/site-chrome.tsx`, `app/globals.css`, `public/news/gorsel-yok.svg`, ve başlık dönüşümünün uygulandığı haber/arama/video/yazar sayfaları.
- Doğrulama: `npm test` içinde üretim derlemesi ve **51 test geçti; 0 başarısız, 0 atlandı** (önceki 48 senaryo korundu, 3 yeni senaryo eklendi). Yeni testler: büyük harf başlık dönüşümü ve kısaltma korunması, spot tekrarının gizlenmesi, ana sayfanın az haberli kurulumda bile bütün bölümleri doldurması, boş reklam yer tutucusunun kalmaması, tembel yükleme, ve aktarımda gerçek haber karesinin yedek olarak kullanılmadığı. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**. Tam arşiv aktarımı gerçek veriyle tamamlandı: **7.712 haber, 0 hata, 0 atlanan, 3.372 saniye**; medya 155 MB/1.453 dosya ölçümünden 0,79 GB'a projekte edildi. Tarayıcıda ana sayfa, `/kategori/gundem`, `/son-dakika` ve `/kategori/kultur-sanat?sayfa=2` kontrol edildi: dört sayfada da **kalan büyük harf başlık sayısı 0**, sayfalama çalışıyor, son dakika akışında 36 satır ve 4 gün grubu render oldu. 375 px mobilde yatay taşma yok.
- Kalan karar veya risk: Başlık dönüşümü sezgiseldir; listede olmayan ve sesli harf içeren bir kısaltma (örn. "AKOM") kelime gibi çevrilebilir. Böyle bir durumda çözüm ya `knownAcronyms` listesine eklemek ya da haberi panelden düzeltmektir; veri bozulmadığı için geri dönüş kaybı yoktur. Kapak görseli olmayan 216 haber için kaynakta da görsel bulunmadığından tekrar denemek sonucu değiştirmez; editör panelden görsel ekleyebilir. Ana sayfada manşet hâlâ `is_featured` işaretine bağlı; arşivde işaretli haber olmadığı için en güncel haberler manşete geçiyor.

### 2026-08-24 — Aktarımda görsel hatasının görünür kılınması

- İstek: Staging'de aktarılan haberlerin görsellerinin gelmemesi.
- Tespit: Staging'de hiçbir `/media/` görseli yok; yerel aktarımda 7.712 haberin 7.380'i görselle indi. Aynı kod, aynı kaynak. Fark sunucu tarafında ve dışarıdan görülemiyor, çünkü `importImage` bütün hataları `catch { return ""; }` ile yutuyordu. Asıl kusur bu: hata sessizce yutulduğu için sebep teşhis edilemiyor.
- Yapılanlar: `importImage` artık başarısızlık sebebini döndürüyor (HTTP kodu, boş yanıt, kaydetme hatası) ve sebep aktarım kaydına yazılıyor. Yönetim paneline **"Eksik görselleri indir"** işlemi eklendi; yalnız kapak görseli inememiş haberlerde görseli yeniden dener, haber metnini yeniden çekmez ve sebepleri sayarak raporlar. `storeImage` artık türü dosya imzasından da tanıyor; kaynak sunucu yanlış veya eksik `content-type` gönderse bile geçerli görsel kaydedilebiliyor.
- Değişen ana dosyalar: `app/api/import/route.ts`, `app/admin/content-import.tsx`, `db/media-storage.ts`, `db/index.ts`, `tests/rendered-html.test.mjs`.
- Doğrulama: `npm test` içinde üretim derlemesi ve **52 test geçti; 0 başarısız, 0 atlandı**. Yeni test: imza tabanlı tür tanıma kuralı, görsel hatasının sessizce yutulmaması, yeniden deneme işleminin yetkisiz erişimi reddetmesi ve sayaç döndürmesi. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**.
- Kalan karar veya risk: Staging'deki görsel hatasının kök nedeni henüz bilinmiyor; panelden "Eksik görselleri indir" çalıştırıldığında sebep ekranda görünecek. En olası adaylar sunucudaki boş disk alanı koruması (1 GB altına düşünce kaydetme reddediliyor) ve medya dizini yazma izni. Sunucu kimlik bilgileri sohbette paylaşıldığı için parola ve API anahtarının değiştirilmesi önerildi.

### 2026-08-24 — Sunucudaki medya izni ve kapak görsellerinin onarımı

- İstek: Staging'de haber görsellerinin görünmemesi; sunucuya bağlanıp sorunun çözülmesi.
- Kök neden: `/srv/kozatv/data/media` dizini `root:root` sahipliğinde ve `700` izniyle oluşturulmuştu; uygulama `kozatv` kullanıcısıyla çalıştığı için dizine hiç yazamıyordu. Aktarımda veritabanı kaydı oluşuyor, dosya yazma işlemi izin hatası alıyor ve haber yer tutucu görsele düşüyordu. Disk sorunu yoktu (38 GB'ın 23 GB'ı boş). Hata `importImage` içinde sessizce yutulduğu için dışarıdan görülemiyordu.
- Yapılanlar: Dizin sahipliği `kozatv:kozatv` ve izni `750` yapıldı; yazma ve alt klasör oluşturma doğrulandı. Dağıtım betiğinin veri dizinine dokunmadığı, dolayısıyla düzeltmenin kalıcı olduğu kontrol edildi. Yalnız kapak görseli eksik haberleri yeniden indiren `scripts/kapak-gorsellerini-onar.mjs` yazıldı; haber metnini yeniden çekmez, var olan görselleri ellemez, tekrar çalıştırmak güvenlidir ve başarısızlık sebeplerini sayarak raporlar.
- Değişen ana dosyalar: `scripts/kapak-gorsellerini-onar.mjs`, `tests/rendered-html.test.mjs`, `AGENTS.md`; sunucuda `/srv/kozatv/data/media` sahiplik ve izni.
- Doğrulama: `npm test` içinde üretim derlemesi ve **53 test geçti; 0 başarısız, 0 atlandı**. Yeni test, onarım aracının depolama kurallarının (SHA-256 tabanlı ad, yıl/ay klasörü, `wx` bayrağı, kabul edilen dört tür) `db/media-storage.ts` ile aynı kalmasını ve aracın veri silmemesini denetler. Araç yerel veritabanında denendi; oradaki 216 haberin kaynağında gerçekten görsel bulunmadığı için "kaynakta kapak görseli yok" sebebiyle raporladı.
- Kalan karar veya risk: Sunucu kimlik bilgileri sohbette paylaşıldı; parolanın ve API anahtarının değiştirilmesi gerekiyor. Medya dizini izni ilk kurulumda yanlış oluşmuştu; benzer kurulumlarda `deployment/hetzner/README.md` adımlarına dizin sahipliği kontrolü eklenmelidir.

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

### 2026-08-25 — Premium ana sayfa ve otomatik manşet vitrini

- İstek: Görsel aktarımı düzeltildikten sonra ana sayfanın, özellikle manşet/slider alanının yeni kurulmuş güçlü bir haber markasına yakışacak kadar modern, alımlı ve otomatik geçişli hale getirilmesi.
- Yapılanlar: Ana sayfa sıcak kâğıt zeminli premium editoryal düzene geçirildi; yeni bölüm girişi, 640 px sinematik manşet, katmanlı kontrast, çağdaş tipografi, cam görünümlü kontrol şeridi, numaralı slaytlar, ilerleme çizgisi, önceki/sonraki ve duraklat/sürdür kontrolleri eklendi. Manşet beş haber arasında 6 saniyede yumuşak geçiyor; fare/klavye etkileşiminde bekliyor ve azaltılmış hareket tercihinde otomatik geçişi kapatıyor. Günün Akışı, öne çıkan kartlar, son haberler, son dakika yan sütunu, yazarlar ve video yüzeyleri aynı tasarım dilinde yenilendi. Eski demo manşetlerinin gerçek arşivin önüne geçmesini engelleyen güncellik ve gerçek görsel öncelikli seçim modeli kuruldu. Mobil QA'da bulunan dört sütuna geri dönen yazar şeridi taşması tek sütunla kapatıldı; manşet metni arka plan sekmesinde dahi tam kontrastla görünür tutuldu.
- Değişen ana dosyalar: `app/page.tsx`, `app/site-client.tsx`, `app/globals.css`, `db/homepage-model.mjs`, `tests/rendered-html.test.mjs`, `scripts/kapak-gorsellerini-onar.mjs`, `AGENTS.md`.
- Doğrulama: Staging ziyaretçi yüzeylerinden örneklenen **127 benzersiz görselin 127'si HTTP 200 ve doğru görsel türüyle** açıldı; çalışma görsel aktarımı yerine tasarıma odaklandı. `npm test` üretim derlemesiyle birlikte **54 test geçti; 0 başarısız, 0 atlandı**. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için **33 performans uyarısı** ile tamamlandı; bağımsız `npm run build` standalone çıktıyı başarıyla üretti. Gerçek tarayıcı motorunda 1440, 768 ve 390 px ölçümlerinde `scrollWidth == innerWidth`; mobil menü görünür. Manşet 6 saniyede 1'den 2'ye otomatik geçti, duraklatıldığında aynı slaytta kaldı; mobil metin opaklığı 1 ve rengi beyaz doğrulandı.
- Kalan karar veya risk: Değişiklikler kullanıcı isteğiyle commit kapsamına alındı; push edilmedi ve staging'e dağıtılmadı. Gerçek 7.712 haberlik staging verisiyle son görsel kabul kontrolü dağıtım onayından sonra yapılmalıdır. Ham `<img>` performans uyarılarının Next Image/CDN kararıyla ayrıca kapatılması gerekir.

### 2026-08-25 — Canlı eski vitrin eşitlemesi ve demo haber temizliği

- İstek: Yeni ana sayfada eski `kozatv.com.tr` ana sayfasında gösterilen gerçek haberlerin aynı sırayla yer alması, tasarımın daha şık kalması ve eski test haberlerinin tamamen kaldırılması.
- Yapılanlar: Eski ana sayfadaki `haber-...html` bağlantılarını görünür sırayla ve tekrarsız çıkaran güvenli ayrıştırıcı eklendi. Admin İçerik Aktarımı ekranına **Canlı ana sayfayı eşitle** işlemi kondu; ilk 25 görünür haber aynı doğrulanmış metin/görsel hattından doğrudan yayına alınıyor, eski adres yönlendirmesi kuruluyor, ilk beş haber manşet sırasına ve ilk haber son dakika bandına atanıyor. İşlem tekrar çalıştırıldığında mükerrer haber üretmiyor. Manşet altı, eski vitrindeki dört güncel haber ritmini koruyan fakat yeni sitenin premium tasarım dilindeki geniş görselli kartlara dönüştürüldü. Bilinen yedi prototip haber slug'ı üretim başlangıcında yalnız boş kaynak + Koza TV eşleşmesiyle siliniyor; demo seed yalnız `KOZA_ENABLE_DEMO_CONTENT=1` açık test ortamında çalışıyor.
- Değişen ana dosyalar: `db/demo-content-model.mjs`, `db/import-model.mjs`, `db/index.ts`, `app/api/import/route.ts`, `app/admin/content-import.tsx`, `app/page.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: Canlı `https://www.kozatv.com.tr/` sayfası izole veritabanına karşı eşitlendi: **25 görünür, 25 yeni, 25 işlenen, 25 sıralanan, 0 hata**. Ana sayfada canlı ilk ve ikinci haber başlıkları göründü, yedi demo haber görünmedi, dört manşet altı kart üretildi ve **13/13 benzersiz medya** HTTP 200 görsel yanıtı verdi. İkinci eşitlemede **0 yeni, 0 işlenen, 25 sıralanan** sonucu alınarak tekrar çalıştırılabilirlik doğrulandı. 390 px mobilde `scrollWidth == innerWidth`, uzun manşet kontrol şeridinin üstünde kaldı. `npm test` içinde üretim derlemesiyle **56 test geçti; 0 başarısız, 0 atlandı**; `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut **33** ham görsel uyarısıyla tamamlandı; bağımsız `npm run build` başarılı.
- Kalan karar veya risk: Değişiklikler kullanıcı isteğiyle commit kapsamına alındı; push edilmedi ve staging'e dağıtılmadı. Canlı eski site değiştikçe yönetici eşitleme düğmesini yeniden çalıştırmalıdır; otomatik zamanlayıcı ayrıca istenirse kurulabilir. Ham `<img>` performans uyarıları nesne depolama/CDN kararıyla ele alınmalıdır.

### 2026-08-25 — Premium ana sayfanın Hetzner staging dağıtımı

- İstek: Commit'e alınan yeni ana sayfa tasarımının, otomatik manşet vitrininin, canlı eski site eşitlemesinin ve demo haber temizliğinin staging ortamına dağıtılması.
- Yapılanlar: `73cafbe` commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, dosya aktarımı ve atomik Hetzner dağıtımını tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `73cafbe`; bu yayın kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` üretim derlemesiyle **56 test geçti; 0 başarısız, 0 atlandı**. GitHub Actions çalışması `32811613369` içindeki **Test ve Hetzner staging dağıtımı** işi başarılı tamamlandı. Dış kontrolde `/`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Staging ana sayfasında **Günün Öne Çıkanları** ve **Günün Akışı** bileşenleri görüldü.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı/DNS geçişi bu dağıtımın kapsamında değildir. Eski sitenin vitrini değiştikçe yönetici **Canlı ana sayfayı eşitle** işlemini yeniden çalıştırmalıdır.

### 2026-08-25 — Sosyal ikonlar ve site geneli etkileşim dili

- İstek: Üst banttaki sosyal medya ikonlarının iç içe görünmesinin düzeltilmesi; kategori menüsüne ve sitenin tamamındaki tıklanabilir yüzeylere belirgin hover, aktif, basılı ve klavye odağı hissi kazandırılması.
- Yapılanlar: Adresi tanımlanmamış sosyal hesapların karakter yer tutucuları kaldırıldı; yalnız gerçek adresi bulunan hesaplar Facebook, X, YouTube ve Instagram için ayrı, erişilebilir SVG ikon düğmeleri olarak gösteriliyor. Ana menüye animasyonlu hover çizgisi, güçlü `aria-current` aktif durumu ve basma geri bildirimi eklendi. Mobil menü, kategori çipleri, sayfalama, haber/yan akış/video/yazar kartları ve metin bağlantıları ortak etkileşim diline geçirildi; dokunmatik cihazlarda yapışkan hover engellendi ve azaltılmış hareket tercihi korundu.
- Değişen ana dosyalar: `app/site-chrome.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` Node 23 ortamında production build ile **56 test geçti; 0 başarısız, 0 atlandı**. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` kullanımları için **33 uyarı** ile tamamlandı; bağımsız `npm run build` başarılı. Geçici veritabanında dört sosyal hesapla 1440 px ana sayfa/kategori/canlı yayın, 768 px kategori ve mobil ana sayfa/haber görünümleri gerçek Chrome motorunda incelendi. Dört ikon birbirinden ayrı dairesel düğmeler olarak göründü; aktif kategori kalın kırmızı çizgiyle ayrıldı. Gerçek 390 px emülasyonda `scrollWidth == innerWidth == 390`, canlı yayın ve menü kontrolleri viewport içinde kaldı. Ana ziyaretçi rotalarının tamamı HTTP 200 döndürdü; Türkçe arama URL kodlamasıyla ayrıca doğrulandı.
- Kalan karar veya risk: Değişiklikler kullanıcı isteğiyle commit ve Hetzner staging dağıtımı kapsamına alındı. Yerel kabuğun varsayılan Node 16 sürümü build başlamadan `node:readline/promises` hatası verdi; proje testleri NVM ile Node 23'e geçirilince eksiksiz geçti. Ham `<img>` performans uyarıları ayrıca ele alınmalıdır.

### 2026-08-26 — Sosyal ikon ve etkileşim sürümünün staging dağıtımı

- İstek: Sosyal medya ikonları ve site geneli tıklama hissi iyileştirmelerinin commit edilip Hetzner staging ortamına dağıtılması.
- Yapılanlar: `17ccea7` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, aktarım ve atomik dağıtım adımlarını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `17ccea7`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` production build ile **56 test geçti; 0 başarısız, 0 atlandı**. `npm run lint` **0 hata** ve mevcut **33** ham görsel performans uyarısıyla, bağımsız `npm run build` başarıyla tamamlandı. GitHub Actions çalışması `32939104787` başarılı oldu. Dış kontrolde `/`, `/kategori/gundem`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Gündem menüsünde tek aktif `aria-current` işareti görüldü ve eski `f𝕏▶◎` ikon dizisi bulunmadı.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı ve DNS geçişi bu dağıtımın kapsamında değildir. Sosyal hesap adresleri panelde boşsa ikonların hiç gösterilmemesi beklenen davranıştır. Ham `<img>` performans uyarıları ayrıca ele alınmalıdır.


### 2026-08-26 — Kompakt son dakika, canlı bilgi bandı ve resmî sosyal hesaplar

- İstek: Ana sayfadaki aşağı doğru gereksiz uzayan son dakika kutusunun ve bozuk “Daha Fazla Haber” alanının yeniden tasarlanması; sıcaklık ve döviz bilgisinin daha güçlü sunulması; admin panelinden yönetilen son dakika ibaresinin haber görsellerinde kullanılması; Koza TV’nin resmî Facebook, X, Instagram ve YouTube hesaplarının eklenmesi.
- Yapılanlar: Son dakika kutusundaki bütün bağlantılara yanlışlıkla uygulanan iki sütunlu grid kuralı yalnız haber satırlarına daraltıldı. Akış beş gelişmeyle sınırlanıp masaüstünde kompakt, tablette iki sütunlu, mobilde tek sütunlu hale getirildi; çağrı bağlantısı tek satırlı güçlü bir butona dönüştürüldü. Üst bant koyu yayın şeridi olarak yeniden tasarlandı; İstanbul hava durumu, Dolar, Euro, Sterlin, TCMB kaynağı ve bülten tarihi birbirinden ayrılan bilgi kartlarıyla sunuldu. Son dakika işareti, admin panelindeki mevcut `isBreaking` alanına bağlı dikey kırmızı görsel şeride dönüştürüldü; normal haberlerde yanlış son dakika bandı ve etiketi kaldırıldı. Editör ekranındaki seçeneğin etkisi açıklığa kavuşturuldu. Resmî hesaplar kanonik adreslerle varsayılanlara eklendi; mevcut veritabanında yalnız boş sosyal ayarları bir kez dolduran ve sonraki yönetici tercihini ezmeyen geçiş kuruldu.
- Değişen ana dosyalar: `app/page.tsx`, `app/site-client.tsx`, `app/site-chrome.tsx` ile ortak çalışan `app/globals.css`, `app/kategori/[slug]/page.tsx`, `app/son-dakika/page.tsx`, `app/haber/[slug]/page.tsx`, `app/admin/panel.tsx`, `app/admin/workflow-studio.tsx`, `db/settings-model.mjs`, `db/index.ts`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **57 test geçti; 0 başarısız, 0 atlandı**. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için **33 performans uyarısı** ile tamamlandı; bağımsız `npm run build` başarılı. Gerçek Chrome motorunda 1440, 900 ve 390 px kontrol edildi: her görünümde `scrollWidth == clientWidth`; son dakika alanı sırasıyla 561/409/517 px yüksekliğinde ve beş satır; çağrı butonu `white-space: nowrap`. Mobilde İstanbul sıcaklığı ve iki temel kur görünür, canlı yayın metni korunur. Dört sosyal hesabın dördü doğru dış adrese gider; son dakika şeridi mobilde 33×105 px, haber detayında 33×92 px ölçüldü. Normal haberin son dakika bandı taşımadığı ayrıca doğrulandı.
- Kalan karar veya risk: Değişiklikler kullanıcı isteğiyle commit ve Hetzner staging dağıtımı kapsamına alındı. TCMB ve hava durumu dış kaynakları erişilemezse mevcut güvenli davranış gereği bilgi kartları gizlenir, uydurma değer gösterilmez. Ham `<img>` performans uyarıları ayrıca ele alınmalıdır.

### 2026-08-26 — Son dakika ve canlı bilgi bandının staging dağıtımı

- İstek: Kompakt son dakika alanının, canlı bilgi bandının, resmî sosyal hesapların ve yönetilebilir son dakika şeridinin commit edilip Hetzner staging ortamına doğrudan dağıtılması.
- Yapılanlar: `9ed185c` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, aktarım ve atomik dağıtım adımlarını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `9ed185c`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` production build ile **57 test geçti; 0 başarısız, 0 atlandı**. GitHub Actions çalışması `32943349518` başarıyla tamamlandı. Dış kontrolde `/`, `/kategori/gundem`, `/son-dakika`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Staging ana sayfasında kompakt çağrı bağlantısı, son dakika görsel şeridi ve dört resmî sosyal hesap doğrulandı.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı ve DNS geçişi bu dağıtımın kapsamında değildir. TCMB ve hava durumu verisi alınamazsa bilgi kartlarının gizlenmesi beklenen güvenli davranıştır. Ham `<img>` performans uyarıları ayrıca ele alınmalıdır.

### 2026-08-26 — Kaynak oranlı manşet ve hareketli sağ son dakika şeridi

- İstek: Son dakika görsel şeridinin Koza TV örneğindeki gibi sağ tarafa alınması ve hareketli, belirgin hale getirilmesi; eski siteden aktarılan görsellerin ana sayfa sliderında kötü kırpılmasının düzeltilmesi.
- Yapılanlar: Canlı Koza TV ana sayfasının güncel kaynakları incelendi; manşet görsellerinin `735×410` oranında sunulduğu ve sliderın otomatik ilerlediği doğrulandı. Yeni ana manşet masaüstü ve tablette doğrudan bu orana bağlandı; mobilde görsel aynı oranla üstte korunup metin koyu okuma alanında bırakıldı. Slider otomatik geçişi 5 saniyeye çekildi. Sağdaki Günün Akışı, manşet oranını bozmaması için dört kompakt gelişmeye indirildi ve grid taşması kapatıldı. Son dakika şeridi bütün haber görsellerinde sağa taşındı; 1,15 saniyelik dikkat animasyonu eklendi, azaltılmış hareket tercihinde animasyon kapatıldı.
- Değişen ana dosyalar: `app/globals.css`, `app/page.tsx`, `app/site-client.tsx`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **57 test geçti; 0 başarısız, 0 atlandı**. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata** ve mevcut **33** ham görsel performans uyarısıyla tamamlandı. Gerçek Chrome motorunda 1440 ve 900 px ekran görüntüleri incelendi; iki sütun çakışmadan hizalandı ve görsel kompozisyonu korundu. Gerçek cihaz emülasyonunda 390 px için `scrollWidth == innerWidth == 390`; sağ şerit 33×105 px, animasyon 1,15 saniye ve slider otomatik geçişi aktif ölçüldü.
- Kalan karar veya risk: Browser becerisi çalışma alanındaki bağlantılı klasör kısıtı nedeniyle açılamadı; canlı kaynak incelemesi ve görsel kabul gerçek yerel Chrome ile tamamlandı. Değişiklikler kullanıcı isteğiyle commit ve Hetzner staging dağıtımı kapsamına alındı. Ham `<img>` performans uyarıları ayrıca ele alınmalıdır.

### 2026-08-26 — Kaynak oranlı manşetin staging dağıtımı

- İstek: Sağdaki hareketli son dakika şeridinin ve `735×410` kaynak oranını koruyan yeni ana sliderın commit edilip Hetzner staging ortamına dağıtılması.
- Yapılanlar: `22a08e0` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, aktarım ve atomik dağıtım adımlarını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `22a08e0`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` production build ile **57 test geçti; 0 başarısız, 0 atlandı**. GitHub Actions çalışması `32946105334` başarılı oldu. Dış kontrolde `/`, `/kategori/gundem`, `/son-dakika`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Staging HTML'inde dört Günün Akışı satırı ve son dakika şeridi; yayın CSS'inde `aspect-ratio:735/410`, sağ konum ve `koza-breaking-pulse` animasyonu doğrulandı.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı ve DNS geçişi bu dağıtımın kapsamında değildir. Ham `<img>` performans uyarıları ayrıca ele alınmalıdır.

### 2026-08-26 — Premium köşe yazarları ve haber servisleri vitrini

- İstek: Ana sayfadaki sıkışık görünen köşe yazarları alanının, kırık görsel hissi vermeyen ve daha hoş bir tasarıma dönüştürülmesi.
- Yapılanlar: Eski dar yazar şeridi kaldırılıp koyu editoryal zeminde dört kartlı **Köşe Yazarları & Haber Servisleri** vitrini kuruldu. Veri modelinde portre alanı bulunmadığı için kırılabilir harici fotoğraf yerine her imza için renk tonlu monogram kullanıldı. Haber merkezi ve servis hesapları köşe yazarı gibi gösterilmek yerine **Haber Servisi** etiketiyle ayrıldı; teknik `Administrator Administrator` adı ziyaretçi yüzeyinde `Koza TV Editör Masası` olarak temizlendi. Her kartta içerik sayısı, son çalışma, kategori ve arşiv bağlantısı gösterildi; belirgin hover, klavye odağı ve azaltılmış hareket desteği eklendi. Düzen masaüstünde dört sütun, tablette iki sütun, mobilde sayfayı taşırmadan yatay snap akışı olarak kuruldu.
- Değişen ana dosyalar: `app/page.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **58 test geçti; 0 başarısız, 0 atlandı**. Yeni regresyon testi vitrinin dört kart, monogram, servis ayrımı, teknik ad temizliği, klavye odağı ve mobil kaydırma sözleşmesini doğruladı. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut **33** ham görsel performans uyarısıyla tamamlandı. Gerçek Chrome motorunda 1440 px görünümde dört eşit kart, 900 px tablette 2×2 düzen ve 390 px mobilde yatay snap akışı incelendi; üç görünümde de `documentWidth == viewportWidth`. Mobil vitrinde `clientWidth 330`, `scrollWidth 1054`, kart genişliği 255 px ve bölüm içindeki görsel sayısı **0** ölçüldü. Masaüstü klavye odağı 3 px beyaz çerçeveyle görünür doğrulandı.
- Kalan karar veya risk: Yazar veri modelinde gerçek portre alanı bulunmadığı için monogram bilinçli olarak kullanılıyor; ileride admin paneline yazar portresi eklendiğinde aynı kart yapısı gerçek fotoğrafı güvenli yedekle gösterebilir. Browser becerisi bağlantılı çalışma klasörü kısıtı nedeniyle açılamadı; görsel kabul gerçek yerel Chrome motoruyla tamamlandı. Değişiklikler kullanıcı isteğiyle commit ve Hetzner staging dağıtımı kapsamına alındı.

### 2026-08-26 — Köşe yazarları vitrininin staging dağıtımı

- İstek: Yeni köşe yazarları ve haber servisleri vitrininin commit edilip Hetzner staging ortamına dağıtılması.
- Yapılanlar: `9386df6` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, dosya aktarımı ve atomik Hetzner dağıtımını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `9386df6`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` production build ile **58 test geçti; 0 başarısız, 0 atlandı**. GitHub Actions çalışması `32953498758` başarılı oldu. Dış kontrolde `/`, `/kategori/gundem`, `/son-dakika`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Staging ana sayfasında **Köşe Yazarları & Haber Servisleri**, dört imza kartı, dört monogram, servis etiketleri ve temizlenen `Koza TV Editör Masası` adı doğrulandı.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı ve DNS geçişi bu dağıtımın kapsamında değildir. Gerçek yazar portreleri için veri modeline ve admin paneline ayrıca portre alanı eklenmelidir; mevcut monogramlar kırık görsel riskini ortadan kaldıran güvenli davranıştır.

### 2026-08-26 — Panelden yönetilen Koza TV mottosu

- İstek: Ana sayfa üst bölümündeki **Doğru haber. Güçlü yorum.** metninin **Şimdi konuşma zamanı** olarak değiştirilmesi ve yönetim panelinden düzenlenebilir hale getirilmesi.
- Yapılanlar: Site ayarları modeline varsayılanı `Şimdi konuşma zamanı` olan zorunlu `siteMotto` alanı eklendi. Motto baştaki/sondaki boşluklardan arındırılıyor, 3–80 karakterle sınırlandırılıyor ve boş değer reddediliyor. Admin **Site Ayarları → Yayın ve canlı akış** bölümünde açıklaması, karakter sınırı ve tarayıcı tarafı zorunluluk işaretiyle düzenlenebiliyor; kaydedilen değer tüm ziyaretçi sayfalarının ortak üst bilgisinde logo yanında gösteriliyor. Eski sabit metin kaynak koddan kaldırıldı.
- Değişen ana dosyalar: `db/settings-model.mjs`, `app/admin/site-settings.tsx`, `app/site-chrome.tsx`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **58 test geçti; 0 başarısız, 0 atlandı**. Regresyon senaryoları varsayılan mottoyu, boşluk temizlemeyi, panelden başarılı kaydı, boş ve 80 karakteri aşan değerlerin reddini, yetkisiz isteğin 401 almasını ve eski sabit metnin kalkmasını doğruladı. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut **33** ham görsel performans uyarısıyla tamamlandı. Gerçek Chrome motorunda 1440 px görünümde motto `220×43` px alanda logo yanında görüldü; 900 ve 390 px kırılımlarında mevcut kompakt header davranışıyla gizlendi. Üç görünümde de `documentWidth == viewportWidth` ve eski motto metni yoktu.
- Kalan karar veya risk: Tablet ve mobilde motto, mevcut 1050 px altı kompakt header kuralı gereği gizlidir; bu değişiklik var olan mobil düzeni korur. Browser becerisi bağlantılı çalışma klasörü kısıtı nedeniyle açılamadı; görsel kabul gerçek yerel Chrome motoruyla tamamlandı. Değişiklikler kullanıcı isteğiyle commit ve Hetzner staging dağıtımı kapsamına alındı.

### 2026-08-26 — Yönetilebilir motto sürümünün staging dağıtımı

- İstek: **Şimdi konuşma zamanı** mottosunun ve admin panelinden yönetim alanının commit edilip Hetzner staging ortamına dağıtılması.
- Yapılanlar: `c8a05c1` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, dosya aktarımı ve atomik Hetzner dağıtımını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `c8a05c1`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` production build ile **58 test geçti; 0 başarısız, 0 atlandı**. GitHub Actions çalışması `32955365880` başarılı oldu. Dış kontrolde `/`, `/kategori/gundem`, `/son-dakika`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve yetkisiz `/api/settings` HTTP 401 döndürdü. Staging ana sayfasında **Şimdi konuşma zamanı** mottosu bulundu ve eski **Doğru haber. Güçlü yorum.** metni bulunmadı.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı ve DNS geçişi bu dağıtımın kapsamında değildir. Tablet ve mobilde motto mevcut kompakt header kuralı gereği gizlidir; yöneticinin değiştirdiği metin masaüstü üst bilgisinde gösterilir.

### 2026-08-26 — Mobil manşette parmakla kaydırma

- İstek: Mobil ana sayfa manşet haberlerinin yalnız sağ/sol düğmeleriyle değil, parmakla sağa ve sola kaydırılarak değiştirilebilmesi.
- Yapılanlar: Manşete modern Pointer Events tabanlı dokunma desteği eklendi. En az 42 px ve yatay yönü baskın hareket sola kaydırmada sonraki, sağa kaydırmada önceki haberi açıyor; kısa dokunuşlar ve dikey sayfa kaydırmaları manşet geçişi sayılmıyor. Kaydırma boyunca otomatik geçiş bekliyor, işlem sonrasında yeniden başlıyor; kaydırma bitişindeki sentetik tıklamanın haber bağlantısını yanlışlıkla açması engellendi. `touch-action: pan-y` ile mobil sayfanın doğal dikey hareketi korundu.
- Değişen ana dosyalar: `app/site-client.tsx`, `app/slider-gesture.mjs`, `app/globals.css`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **58 test geçti; 0 başarısız, 0 atlandı**. `npx tsc --noEmit` ve bağımsız `npm run build` başarılı; `npm run lint` **0 hata**, mevcut **33** ham görsel performans uyarısıyla tamamlandı. Gerçek Chrome motorunda 390 px dokunmatik emülasyonda beş manşetli geçici veriyle sola kaydırma `01 → 02`, sağa kaydırma `02 → 01` çalıştı; kısa dokunuş ve dikey hareket manşeti değiştirmedi, dikey sayfa kaydırması korundu, yanlış haber navigasyonu ve yatay taşma oluşmadı.
- Kalan karar veya risk: Browser becerisi çalışma alanındaki sembolik klasör kısıtı nedeniyle açılamadı; gerçek cihaz davranışı yerel Chrome 151 dokunmatik emülasyonuyla doğrulandı. Değişiklikler kullanıcı isteğiyle commit ve Hetzner staging dağıtımı kapsamına alındı.

### 2026-08-26 — Mobil manşet kaydırmasının staging dağıtımı

- İstek: Mobil manşette parmakla sağa/sola kaydırma desteğinin commit edilip Hetzner staging ortamına dağıtılması.
- Yapılanlar: `b98c88a` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, dosya aktarımı ve atomik Hetzner dağıtımını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `b98c88a`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` production build ile **58 test geçti; 0 başarısız, 0 atlandı**; `npx tsc --noEmit`, `npm run lint` ve bağımsız `npm run build` başarılı oldu. GitHub Actions çalışması `32973736863` başarıyla tamamlandı. Dış kontrolde `/`, `/kategori/gundem`, `/son-dakika`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Yayın CSS'inde `touch-action:pan-y`, istemci paketinde Pointer Events kodu doğrulandı. Staging'in gerçek beş manşetli verisinde 390 px Chrome dokunmatik emülasyonuyla sola kaydırma `01 → 02`, sağa kaydırma `02 → 01` çalıştı; yanlış navigasyon ve yatay taşma oluşmadı.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı ve DNS geçişi bu dağıtımın kapsamında değildir. Mobil kaydırma düğmelere ek bir kullanım yoludur; mevcut sağ/sol ve erişilebilir klavye kontrolleri korunmuştur.

### 2026-08-29 — Yetkili ajans akış merkezi ve kaynağa özel bilgilendirme

- İstek: Eski Koza TV haber detayında görülen AA, İHA, DHA ve diğer ajanslara ilişkin genel bilgilendirmenin yeni sitede yönetilip yönetilemediğinin incelenmesi; yoksa ajans haberlerini metin, görsel ve diğer alanlarıyla otomatik alabilecek gerçek bir yönetim ve aktarım yapısının kurulması.
- Yapılanlar: Mevcut **Kaynak Merkezi**nin yalnız ad/URL kaydı tuttuğu, hiçbir veri çekme veya zamanlama işlemi yapmadığı doğrulandı ve ekran gerçek **Ajans Akış Merkezi**ne dönüştürüldü. AA, İHA, DHA ve diğer sözleşmeli sağlayıcılar için HTTPS uç noktası, RSS/Atom, NewsML-G2 veya JSON biçimi, Bearer/Basic/IP izinli erişim, yalnız ortam değişkeni adıyla gizli anahtar yönetimi, 5–1440 dakikalık periyot, kategori eşlemesi, editör kuyruğu veya açıkça seçilen doğrudan yayın, aktif/pasif durum, bağlantı testi, elle çekme, son başarı/hata ve kayıt sayaçları eklendi. Ajans verisi ortak modele dönüştürülürken tam ham kayıt, ajans kimliği, başlık, spot, gövde, kategori, imza, tarih, güncelleme, konum, öncelik, hak bilgisi, etiket, fotoğraf ve video alanları korunuyor. `(source_id, external_id)` ile mükerrer kayıt engelleniyor; değişiklikler revizyona, geri çekmeler yayından kaldırmaya ve bütün işlemler denetim kaydına yazılıyor. Görseller dosya imzasıyla doğrulanıp yerel medya kütüphanesine alınıyor; ilk fotoğraf kapak, diğer medya içerik bloğu oluyor. Feed ve medya yanıtlarında boyut sınırı, HTTPS, DNS/IP özel ağ engeli, sınırlı yönlendirme ve kimlik bilgisini başka origin'e taşımama kontrolleri uygulandı. Yalnız ajans bağlantılı haberlerde kaynak adı, ajans kayıt numarası, alınma zamanı ve panelden ajans bazında düzenlenen bilgilendirme gösteriliyor; Koza TV'nin kendi haberlerine blanket metin eklenmiyor. Beş dakikalık systemd zamanlayıcısı ve gizli `/etc/kozatv/agency.env` operasyonu hazırlandı.
- Değişen ana dosyalar: `db/agency-model.mjs`, `db/index.ts`, `app/api/agency/route.ts`, `app/api/sources/route.ts`, `app/admin/agency-sources.tsx`, `app/admin/panel.tsx`, `app/haber/[slug]/page.tsx`, `app/globals.css`, `deployment/hetzner/kozatv.service`, `deployment/hetzner/kozatv-agency-pull.service`, `deployment/hetzner/kozatv-agency-pull.timer`, `deployment/hetzner/README.md`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: Canlı eski haber sayfasındaki genel ajans metni doğrulandı; ancak sayfanın bu özel haber için ajans kimliği göstermediği tespit edildi. AA'nın resmî Haber Akış Sistemi/API/XML/NewsML ve abonelik sayfaları, İHA'nın resmî XML/RSS otomatik entegrasyon/abonelik açıklaması ve DHA'nın resmî abonelik-bülten dağıtım sayfası incelendi. `npm test` production build ile **61 test geçti; 0 başarısız, 0 atlandı**. Yeni senaryolar güvenli kaynak doğrulamasını, gizli değerin API/veritabanına sızmamasını, RSS/Atom, NewsML-G2 ve JSON tam alan eşlemesini, kategori eşlemesini, kaynak oluşturma/güncelleme yetkisini, oturumsuz çekim engelini, kaynağa özel haber bilgilendirmesini ve otomatik systemd sözleşmesini kapsıyor. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için **33 uyarı** ile tamamlandı. Gerçek tarayıcı motorunda 1280 px masaüstü, 900 px tablet ve 390 px mobil Ajans Akış Merkezi kontrol edildi; üç görünümde yatay taşma olmadı, form ve kontroller kırılımlara uygun yerleşti.
- Kalan karar veya risk: Hiçbir AA/İHA/DHA canlı akışı henüz bağlanmadı; gerçek otomasyon için ilgili ajansla kurumsal abonelik, ajansın verdiği endpoint/NewsML veya API örneği, erişim anahtarı ve varsa IP izin listesi gerekir. Her sağlayıcının gerçek örnek bülteni **Bağlantıyı test et** sonucuyla karşılaştırılmadan doğrudan yayın açılmamalıdır. Paneldeki bilgilendirme metni kaynak bazında yönetilir fakat sorumluluğu kendiliğinden ajansa devreden bir hukuki garanti değildir; canlıya alınmadan önce yayın kuruluşunun hukuk danışmanı tarafından kesinleştirilmelidir. Systemd dosyaları repoda hazırdır; canlı sunucuda timer kurulumu ve `/etc/kozatv/agency.env` tanımı dağıtım sırasında yapılmalıdır. Değişiklikler commit edilmedi ve staging'e dağıtılmadı.

### 2026-08-29 — Otomatik TCMB kur yenilemesi

- İstek: Üst bilgi bandındaki Dolar, Euro ve Sterlin değerlerinin statik kalmaması; gerçek bir veri kaynağından otomatik güncellenmesi.
- Yapılanlar: Kur değerlerinin zaten resmî TCMB `today.xml` bülteninden sunucu tarafında okunduğu doğrulandı; kodda sabit kur değeri bulunmadı. Eksik olan açık sayfa yenilemesi tamamlandı: tarayıcı `/api/piyasa` verisini beş dakikada bir önbelleksiz yeniden istiyor, sekme yeniden görünür olduğunda ve bağlantı geri geldiğinde anında kontrol ediyor. Sunucu TCMB ve hava durumu kaynaklarını 15 dakikalık kontrollü önbellekle okuyor. Kaynak alanına yeşil durum noktası, **Otomatik** ibaresi, son bülten tarihi ve araç ipucunda son kontrol saati eklendi; dinamik değişiklikler ekran okuyuculara nazikçe duyuruluyor.
- Değişen ana dosyalar: `app/site-client.tsx`, `app/api/piyasa/route.ts`, `app/globals.css`, `app/admin/site-settings.tsx`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **58 test geçti; 0 başarısız, 0 atlandı**. Yeni regresyon kontrolleri beş dakikalık tarayıcı yenilemesini, önbelleksiz isteği, sekmeye dönüş/bağlantı geri gelişi tetiklerini, resmî TCMB veri adresini, 15 dakikalık sunucu önbelleğini, kaynak ibaresini ve erişilebilir canlı duyuruyu doğruladı. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut **33** ham görsel performans uyarısıyla tamamlandı. Yerel `/api/piyasa` gerçek TCMB yanıtıyla USD 48,16, EUR 56,09, GBP 65,55 ve bülten tarihi 28.08.2026 döndürdü. Gerçek uygulama tarayıcısında 1440, 900 ve 390 px görünümler kontrol edildi; yatay taşma ve konsol hatası yoktu, masaüstünde üç kur ile **TCMB · 28.08.2026 · Otomatik** birlikte göründü.
- Kalan karar veya risk: TCMB verisi gerçek zamanlı serbest piyasa fiyatı değil, her iş günü yayımlanan resmî gösterge satış kurudur; hafta sonu ve resmî tatillerde son iş gününün tarihi görünür. Canlı/anlık piyasa kuru istenirse ayrıca lisanslı bir gerçek zamanlı veri sağlayıcısı seçilmelidir. Değişiklikler henüz commit edilmedi ve staging'e dağıtılmadı.

### 2026-08-29 — BIST, altın ve yön göstergeli piyasa bandı

- İstek: Eski Koza TV ana sayfasındaki gibi BIST, altın, dolar ve euro değerlerinin değişim yüzdesiyle; yükselişte yeşil yukarı, düşüşte kırmızı aşağı işaretiyle otomatik gösterilmesi.
- Yapılanlar: Eski `kozatv.com.tr` üst bandındaki dört değerin Mynet Finans genel piyasa akışıyla birebir eşleştiği doğrulandı. Yeni sunucu tarafı ayrıştırıcı BIST 100, gram altın, dolar ve euro değerlerini, değişim yüzdelerini, yönlerini ve veri zamanlarını sıkı biçimde doğrulayıp Türkçe biçimlendiriyor. Birincil akış erişilemezse yalnız resmî TCMB dolar/euro değerleri nötr ve yüzdesiz güvenli yedek olarak gösteriliyor; BIST veya altın değeri uydurulmuyor. Üst bant yeşil/kırmızı yön okları, yüzde değişimi, kaynak ve otomatik güncelleme durumu ile yenilendi. Masaüstü ve tablette dört veri aynı satırda; mobilde hiçbir kalem gizlenmeden bandın kendi içinde yatay kaydırılabiliyor. Her veri için yön, değer ve kaynak zamanı erişilebilir etikette açıklanıyor.
- Değişen ana dosyalar: `app/api/piyasa/market-model.mjs`, `app/api/piyasa/route.ts`, `app/site-client.tsx`, `app/globals.css`, `app/admin/site-settings.tsx`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **59 test geçti; 0 başarısız, 0 atlandı**. Yeni testler dört piyasa kaleminin Türkçe sayı/yüzde biçimini, yükseliş-düşüş-nötr yönlerini, eksik veya bozuk kaynak verisinin reddini, birincil Mynet adresini, TCMB yedeğini, beş dakikalık önbellek/yenileme sözleşmesini ve erişilebilir yön metinlerini doğruladı. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut **33** ham görsel performans uyarısıyla tamamlandı; bağımsız `npm run build` başarılı oldu. Yerel `/api/piyasa` isteği BIST 14.642 (%0,45), altın 6.909 (%-3,01), dolar 48,24 (%0,18) ve euro 55,92 (%-0,49) döndürdü. Gerçek uygulama tarayıcısında 1440, 900 ve 390 px kontrol edildi: dört kalem görünür, renk ve yönler doğru, sayfada yatay taşma ve konsol hatası yok; mobil piyasa şeridi `375/684 px` kendi içinde kaydırılabilir ölçüldü.
- Kalan karar veya risk: Mynet Finans üçüncü taraf ve gecikmeli bir piyasa kaynağıdır; okura her kalemin kaynak zamanı gösterilir. Lisanslı gerçek zamanlı Borsa İstanbul yayını istenirse sözleşmeli bir veri sağlayıcıya geçilmelidir. Değişiklikler henüz commit edilmedi ve staging'e dağıtılmadı.

### 2026-08-29 — Yön göstergeli piyasa bandının staging dağıtımı

- İstek: BIST 100, altın, dolar ve euro değişimlerini gösteren yeni piyasa bandının commit edilip Hetzner staging ortamına dağıtılması.
- Yapılanlar: `e6ec993` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, dosya aktarımı ve atomik Hetzner dağıtımını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `e6ec993`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` production build ile **59 test geçti; 0 başarısız, 0 atlandı**. GitHub Actions çalışması `33265340143` başarıyla tamamlandı. Dış kontrolde `/`, `/kategori/gundem`, `/son-dakika`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Staging `/api/piyasa` yanıtında Mynet Finans kaynaklı BIST 100, altın, dolar ve euro; değişim yüzdeleri, `up/down` yönleri ve kaynak zamanları doğrulandı. Gerçek uygulama tarayıcısında 1440 px görünümde dört kalem doğru yeşil/kırmızı renklerle gösterildi; 390 px mobilde dört kalem korunup piyasa şeridi kendi içinde kaydırıldı, sayfada yatay taşma ve konsol hatası oluşmadı.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı ve DNS geçişi bu dağıtımın kapsamında değildir. Mynet Finans gecikmeli üçüncü taraf kaynaktır; lisanslı gerçek zamanlı Borsa İstanbul verisi ayrıca sağlayıcı sözleşmesi gerektirir.

### 2026-08-29 — Piyasa bandından kaynak markasının kaldırılması

- İstek: Üst piyasa bandında görünen **Mynet Finans** kaynak kutusunun tamamen kaldırılması.
- Yapılanlar: Ziyaretçi üst bandındaki kaynak adı, tarih ve **Otomatik** metnini içeren ayrı kutu ile bu kutuya ait bütün CSS kuralları kaldırıldı. BIST 100, altın, dolar ve euro değerleri; yüzdeler, yeşil/kırmızı yön okları, beş dakikalık otomatik yenileme ve her kalemin erişilebilir veri zamanı korunuyor. Kaynak kutusunun ziyaretçi bileşenine yeniden eklenmesini engelleyen regresyon kontrolü eklendi.
- Değişen ana dosyalar: `app/site-client.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **59 test geçti; 0 başarısız, 0 atlandı**. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut **33** ham görsel performans uyarısıyla tamamlandı. Gerçek uygulama tarayıcısında 1440, 900 ve 390 px görünümler kontrol edildi: görünür **Mynet Finans** metni ve kaynak kutusu sayısı sıfır, dört piyasa kalemi görünür, sayfada yatay taşma ve konsol hatası yok; mobil bant kendi içinde kaydırılabilir durumda.
- Kalan karar veya risk: Değişiklikler henüz commit edilmedi ve staging'e dağıtılmadı. Piyasa verisinin sunucu tarafındaki sağlayıcısı değişmedi; yalnız üçüncü taraf marka sunumu ziyaretçi arayüzünden kaldırıldı.

### 2026-08-29 — Kaynak markası kaldırılmış piyasa bandının staging dağıtımı

- İstek: Üst banttan kaldırılan **Mynet Finans** kaynak kutusunun commit edilip Hetzner staging ortamına dağıtılması.
- Yapılanlar: `573160c` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı test, dosya aktarımı ve atomik Hetzner dağıtımını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `573160c`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: Push öncesinde `npm test` production build ile **59 test geçti; 0 başarısız, 0 atlandı**. GitHub Actions çalışması `33265762508` başarıyla tamamlandı. Dış kontrolde `/`, `/kategori/gundem`, `/son-dakika`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Staging ana sayfasının gerçek tarayıcı kontrolünde 1440 ve 390 px görünümlerde görünür **Mynet Finans** metni ve `.live-data-source` kutusu sayısı sıfır; BIST 100, altın, dolar ve euro kartlarının dördü de görünür, sayfada yatay taşma ve konsol hatası yok.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı ve DNS geçişi bu dağıtımın kapsamında değildir. Piyasa verisinin sunucu tarafındaki sağlayıcısı değişmedi; üçüncü taraf marka yalnız ziyaretçi arayüzünden kaldırıldı.

### 2026-08-29 — Opsiyonel ajans kimliği ve rol bazlı haber yetkileri

- İstek: Ajanslardan alınan haberlerin tek tek düzenlenebilmesi; ajans kimliği, kaynak kaydı ve fotoğraf kredisinin değiştirilebilir ve zorunlu olmayan alanlara dönüştürülmesi; bu işlemleri yapabilecek kullanıcı rollerinin netleştirilmesi.
- Yapılanlar: Haber editörüne isteğe bağlı ajans bağlantısı, ajans kayıt numarası, fotoğraf/telif kredisi ve kaynak alanları eklendi. Yönetici, yayın yönetmeni ve editör bu bilgileri değiştirebilir, boşaltabilir veya haberi ajanstan tamamen ayırabilir; boş alanlar ziyaretçi haber detayında gösterilmez. Ajans bazındaki bilgilendirme metni de boş bırakılabilir hale getirildi. Editörün ajans haberini düzenlemesi otomatik kaynak güncellemesine karşı koruma oluşturuyor; yeni ajans sürümü geldiğinde içerik ezilmek yerine bekleyen güncelleme uyarısı veriliyor. Yönetici ve yayın yönetmeni bütün haberleri düzenleyip yayınlayabilir; editör taslak/inceleme haberlerini ve ajans alanlarını düzenleyebilir fakat doğrudan yayınlayamaz; muhabir yalnız kendisine atanmış taslakları düzenleyebilir ve ajans alanlarını değiştiremez; görüntüleyici salt okunurdur. Atama, durum geçişi ve API kontrolleri aynı rol kurallarıyla sunucu tarafında zorunlu hale getirildi.
- Değişen ana dosyalar: `db/editorial-permissions.mjs`, `db/agency-model.mjs`, `db/index.ts`, `app/api/articles/route.ts`, `app/api/editorial/route.ts`, `app/api/agency/route.ts`, `app/admin/panel.tsx`, `app/admin/workflow-studio.tsx`, `app/admin/agency-sources.tsx`, `app/haber/[slug]/page.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **64 test geçti; 0 başarısız, 0 atlandı**. Yeni regresyon senaryoları boş ajans bilgilendirmesini, ajans bağlantısını/kimliğini/krediyi kaldırmayı, haber detayında boş alanların gizlenmesini, korunan ajans güncellemesinin beklemeye alınmasını ve yönetici-yayın yönetmeni-editör-muhabir-görüntüleyici ayrımını kapsıyor. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için **33 uyarı** ile tamamlandı; bağımsız `npm run build` başarılı oldu. Gerçek uygulama tarayıcısında 1280 px masaüstü, 900 px tablet ve 390 px mobil haber editörü kontrol edildi; üç görünümde yatay taşma olmadı. Gerçek editör oturumunda Ajans Akış Merkezi gizli, yalnız **Editör incelemesine gönder** ve **Taslak kaydet** işlemleri görünür, isteğe bağlı ajans alanları düzenlenebilir olarak doğrulandı.
- Kalan karar veya risk: AA, İHA veya DHA'nın gerçek canlı akışı henüz bağlı değildir; üretim otomasyonu için sözleşmeli endpoint ve erişim bilgileri gerekir. Editör korumasında bekleyen ajans güncellemesi mevcut arayüzde koruma kaldırılıp yeniden çekilerek uygulanır; yan yana sürüm karşılaştırması sonraki editoryal iyileştirme olarak ele alınabilir. Ajans bilgilendirme metninin boş bırakılabilmesi teknik olarak mümkündür; hukuki metnin kullanımı yayın kuruluşunun hukuk danışmanıyla belirlenmelidir.

### 2026-08-29 — Ajans akışı ve rol güvenliğinin staging dağıtımı

- İstek: Yetkili ajans akış merkezi, isteğe bağlı haber bazlı ajans alanları ve rol sınırlarının commit edilip staging ortamına dağıtılması.
- Yapılanlar: `a5371fa` uygulama commit'i fast-forward olarak `main` branch'ine push edildi. GitHub Actions üzerindeki **Koza TV Staging** iş akışı temiz kurulum, production bağımlılık denetimi, 64 test, lint, sunucu tarafı yeniden test, atomik sürüm değişimi ve dış smoke test adımlarını başarıyla tamamladı.
- Değişen ana dosyalar: Dağıtılan uygulama sürümü `a5371fa`; dağıtım kaydı için `AGENTS.md`.
- Doğrulama: GitHub Actions çalışması `33269202887` başarılı tamamlandı. Dış kontrolde `/`, `/kategori/gundem`, `/son-dakika`, `/canli`, `/yazarlar` ve `/admin/giris` HTTP 200; `/admin` HTTP 307 ve `/api/auth/me` HTTP 401 döndürdü. Oturumsuz ajans çekme isteği HTTP 401 ile reddedildi. Push öncesinde `npm test` production build ile **64 test geçti; 0 başarısız, 0 atlandı**; `npx tsc --noEmit`, `npm run lint` ve bağımsız `npm run build` başarılı oldu.
- Kalan karar veya risk: Staging IP üzerinden HTTP çalışmaktadır; canlı alan adı/DNS geçişi bu dağıtım kapsamında değildir. Zamanlayıcı ve servis dosyaları sürümle sunucuya ulaştı ancak gerçek ajans abonelik bilgileri ve `KOZA_AGENCY_CRON_TOKEN` tanımlanmadan etkinleştirilmemelidir. AA/İHA/DHA akışlarından hiçbiri henüz bağlı değildir.

### 2026-08-31 — Panelden yönetilen reklam envanteri ve Koza TV tanıtımları

- İstek: Patronların sitedeki reklam alanlarını gerçek sayfa bağlamında görebilmesi; alanların açıkça reklam olarak belirtilmesi; şimdilik Koza TV kurum içi tanıtımlarının dummy kreatif olarak kullanılması; profesyonel haber sitelerindeki reklam yönetiminin incelenip yönetim paneline taşınması.
- Yapılanlar: Reklam konumu ile kampanya/kreatif birbirinden ayrıldı. Kodda sabit kalan dört envanter konumu (`site_top`, `home_billboard`, `section_inline`, `article_sidebar`) ve yönetim panelinden değiştirilen reklamveren, kampanya adı, başlık, açıklama, görsel, hedef, buton, tema, yayın türü, öncelik, başlangıç/bitiş ve aktiflik alanları oluşturuldu. İlk kurulum her eksik konuma bir Koza TV kurum içi tanıtımı ekliyor, sonraki yönetici tercihlerini ezmiyor. Bütün kreatiflerde kod tarafından üretilen ve panelden kaldırılamayan **REKLAM** etiketi bulunuyor; ücretli/dış hedefler `rel="sponsored nofollow"`, kurum içi Koza TV bağlantıları normal iç bağlantı olarak işaretleniyor. Ana sayfa, kategori, son dakika ve haber detay sayfaları duyarlı reklam bileşenine geçirildi; bölüm içi reklam ilk altı haberden sonra gösteriliyor, eski boş `300 × 250` kutusu kaldırıldı. Görselsiz veya kırık görselli kreatifler ölçüyü bozmayan kontrollü metin yedeğine düşüyor; ziyaretçiye teknik konum/ölçü kodları gösterilmiyor.
- Yapılanlar (admin ve güvenlik): **Reklam Merkezi** dört numaralı envanter kartı, gerçek “yayında/yedekte/planlandı/durduruldu” ayrımı, canlı ön izleme, medya kütüphanesinden seçim, doğrulanmış görsel yükleme, tek tıkla durdurma/yeniden başlatma ve Türkiye saatli yayın planıyla sadeleştirildi. Form üç kısa adıma ayrıldı; gelişmiş alanlar isteğe bağlı bölümde tutuldu, henüz bağlı olmayan programatik seçenek kullanılamaz hale getirildi. Alan bazlı hata ve klavye odağı, yükleniyor/başarı/ağ hatası durumları, kaydedilmemiş değişiklik uyarısı ve mobilde seçilen kampanyaya otomatik kaydırma eklendi. Yalnız yönetici ve yayın yönetmeni envanteri görebiliyor ve değiştirebiliyor. API'de POST oluşturma/PATCH güncelleme ayrıldı; bulunamayan kayıt 404, eski sürümle eşzamanlı güncelleme 409 dönüyor ve başarısız çakışma denetim kaydı üretmiyor. Denetim kaydı önce/sonra verisini ve işlemi yapanın kimlik/rolünü tutuyor. Güvenli bağlantı kontrolü ters eğik çizgi, origin kaçışı, kimlik bilgili URL, HTTP dış hedef, `javascript:`/`file:` ve kontrol karakterlerini reddediyor; buton metni hedef adres olmadan kabul edilmiyor. Tarih girişleri sunucudan bağımsız olarak Europe/Istanbul saatine çevriliyor, başlangıç/bitiş ve öncelik sınırları hem model hem SQLite kısıtlarıyla korunuyor.
- Değişen ana dosyalar: `db/ad-model.mjs`, `db/index.ts`, `app/api/ads/route.ts`, `app/ad-slot.tsx`, `app/ad-image.tsx`, `app/admin/ad-form-model.mjs`, `app/admin/advertising-center.tsx`, `app/admin/panel.tsx`, `app/site-chrome.tsx`, `app/page.tsx`, `app/kategori/[slug]/page.tsx`, `app/son-dakika/page.tsx`, `app/haber/[slug]/page.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: `npm test` production build ile **68 test geçti; 0 başarısız, 0 atlandı**. Regresyon paketi dört sabit konumu, eksik seed tamamlama, tek yayındaki kampanya seçimi, programlı/aktif/durdurulmuş/süresi dolmuş durumları, öncelik, tarih sınırı, güvenli/güvensiz URL'ler, zorunlu alan ve uzunluklar, görselsiz/kırık görsel, iç/dış bağlantı işaretleri, medya yükleme, optimistic concurrency, denetim kaydı, POST/PATCH/400/401/403/404/409 sözleşmeleri, yönetici-yayın yönetmeni-editör-muhabir-görüntüleyici ayrımı ve dört ziyaretçi yüzeyini kapsıyor. `npx tsc --noEmit` ve bağımsız `npm run build` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için **35 performans uyarısıyla** tamamlandı. Gerçek uygulama tarayıcısında 1280 px masaüstü, 900 px tablet ve 390/360 px mobil Reklam Merkezi ile ziyaretçi reklamları kontrol edildi; tüm görünümlerde sayfa yatay taşmadı. Mobil form 351 px içinde, giriş metinleri 14 px ve ana işlem 44 px ölçüldü. Boş alan, hedefsiz buton, görsel yükleme/ön izleme, kırık görsel yedeği, kaydedilmemiş formdan çıkış uyarısı ve sunucu kesintisi ayrı ayrı denendi; kesintide açıklayıcı hata gösterildi, form kaybolmadı ve işlem düğmesi yeniden etkinleşti. Rota kontrolünde `/`, `/kategori/gundem`, `/son-dakika`, `/admin/giris` HTTP 200; oturumsuz `/admin` HTTP 307 ve `/api/ads` HTTP 401 döndürdü.
- Kalan karar veya risk: Şimdilik yalnız Koza TV kurum içi tanıtımları vardır; ticari satış başladığında sözleşme/fatura/vergi akışı, gösterim-tıklama raporlaması, kampanya rezervasyonu ve gerekiyorsa Google Ad Manager entegrasyonu ayrıca kurulmalıdır. Programatik veya kişiselleştirilmiş reklamdan önce KVKK/çerez rızası ve hukuk değerlendirmesi gerekir. Pop-up, otomatik ses, tam ekran engelleme ve yüksek mobil reklam yoğunluğu bilinçli olarak desteklenmiyor. Değişiklikler henüz commit edilmedi ve staging'e dağıtılmadı.

### 2026-08-31 — Reklam Merkezi yönetim ekibi kullanım kılavuzu

- İstek: Yönetim ekibinin Reklam Merkezi'ni teknik bilgi gerektirmeden kullanabilmesi için basit, vurucu ve gerçek ekran görüntüleriyle desteklenen bir kullanıcı dokümanı hazırlanması.
- Yapılanlar: Koza TV kurumsal diliyle sekiz sayfalık Word kılavuzu oluşturuldu. Kılavuz; yetkili roller, beş adımlı güvenli yayın akışı, dört sabit reklam alanı, yeni reklam oluşturma, görsel ve bağlantı kuralları, Türkiye saatine göre yayın planlama, Yayında/Yedekte/Planlandı/Durduruldu/Süresi Doldu durumları, durdurma-başlatma işlemleri, masaüstü ve mobil canlı sayfa kontrolü, hata yardımı ve yayın öncesi kontrol listesini kapsıyor. Görseller ayrı test veritabanı ve yerel yönetici hesabıyla çalışan gerçek uygulamadan alındı; staging veya canlı veri değiştirilmedi. Belgedeki logo ve beş farklı gerçek ekran görüntüsü erişilebilir alternatif açıklamalarla işlendi; ana sayfa görünümü iki bölümde bağlama göre tekrar kullanıldı.
- Değişen ana dosyalar: `docs/yonetim/Koza-TV-Reklam-Merkezi-Yonetim-Kilavuzu.docx`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: Word dosyası bozulmaya karşı ZIP/OOXML testiyle açıldı; gerçek panel ifadeleri, dört alan adı, Türkiye saati, canlı kontrol adımı, en az altı gömülü görsel ve tüm görsel açıklamaları regresyon testiyle doğrulandı. Üretim derlemesiyle birlikte `npm test` **69 test geçti; 0 başarısız, 0 atlandı**. `npx tsc --noEmit` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için **35 performans uyarısıyla** tamamlandı; bağımsız `npm run build` başarılı oldu. Belge LibreOffice motoruyla PDF/PNG'ye çevrilip sekiz sayfanın tamamı tek tek görsel kontrolden geçirildi; boş sayfa, taşma ve kırpılma bulunmadı. Otomatik erişilebilirlik denetimi **0 yüksek, 0 orta, 0 düşük** bulgu verdi; görsel denetimi yedi erişilebilir satır içi görsel doğruladı.
- Kalan karar veya risk: Kılavuz mevcut Reklam Merkezi sürümünü anlatır; alan adları, butonlar veya yetki modeli değişirse aynı sürümde güncellenmelidir. Dosya commit edilmedi ve staging'e dağıtılmadı.

### 2026-08-31 — Kılavuz testinin dağıtım ortamından bağımsızlaştırılması

- İstek: Reklam Merkezi ve yönetim kılavuzunun bütün doğrulama kapıları korunarak staging ortamına yayınlanması.
- Yapılanlar: İlk staging çalışmasında GitHub tarafındaki temiz kurulum, production bağımlılık denetimi, build, 69 test ve lint başarılı oldu; sunucudaki atomik dağıtımın yeniden çalıştırdığı test paketi ise yalnız işletim sisteminde `unzip` komutu bulunmadığı için kılavuz testinde durdu. Otomatik süreç mevcut çalışan sürümü değiştirmedi. DOCX doğrulaması sistem paketine bağlı olmaktan çıkarılıp projede doğrudan tanımlanan `fflate` ile Word arşivini açacak, `document.xml` içeriğini ve gömülü medya envanterini aynı kapsamda kontrol edecek biçime getirildi.
- Değişen ana dosyalar: `package.json`, `package-lock.json`, `tests/rendered-html.test.mjs`, `AGENTS.md`.
- Doğrulama: Düzeltmeden sonra `npm test` production build ile **69 test geçti; 0 başarısız, 0 atlandı**. `npx tsc --noEmit` ve bağımsız `npm run build` başarılı; `npm run lint` **0 hata**, mevcut ham `<img>` yüzeyleri için **35 performans uyarısıyla** tamamlandı. `npm audit --omit=dev` **0 production açığı** bildirdi.
- Kalan karar veya risk: Düzeltme henüz staging'e dağıtılmadı; yeni commit aynı atomik yayın hattından geçirilecek ve dış rota/reklam yerleşimi kontrolleri başarıdan sonra kaydedilecektir.
