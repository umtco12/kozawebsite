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
- Haber sitesi kodu `app/`, statik medya `public/`, veri şeması `db/` ve `drizzle/`, Worker kodu `worker/` altında tutulur.
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

### Yeni günlük kaydı şablonu

Her yeni işte aşağıdaki biçimi kullan:

```md
### YYYY-AA-GG — Kısa iş adı

- İstek:
- Yapılanlar:
- Değişen ana dosyalar:
- Doğrulama:
- Kalan karar veya risk:
```
