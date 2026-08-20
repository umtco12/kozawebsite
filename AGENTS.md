# Koza TV Proje Çalışma Kuralları

Bu dosya Koza TV projesinin ortak çalışma hafızasıdır. İnsan veya yapay zekâ fark etmeksizin projede çalışacak herkes işe başlamadan önce bu dosyanın tamamını okumalıdır.

## 1. Projenin tek kaynağı

- Yerel proje: `/Users/umutkara/Desktop/Hitit/UMUT/APP/KOZA`
- GitHub: `https://github.com/umtco12/kozawebsite`
- Ana branch: `main`
- Tasarım referansı: `https://kozatv-haber.kozatv.workers.dev/`
- Canlı marka alan adı: `https://www.kozatv.com.tr/`
- Eski proje, rapor ve tasarımlar aktif projeye geri kopyalanmamalıdır.
- Eski dosyaların arşivi: `/Users/umutkara/Desktop/Hitit/UMUT/APP/KOZA_BACKUP_20260820`

## 2. Her çalışmada zorunlu sıra

1. Bu `AGENTS.md` dosyasını tamamen oku.
2. `git status --short --branch` ile branch ve değişiklikleri kontrol et.
3. Kullanıcının mevcut değişikliklerini silme, üzerine yazma veya habersizce commit kapsamına alma.
4. İstenen işi küçük, anlaşılır ve geri alınabilir değişikliklerle gerçekleştir.
5. En az `npm run build` çalıştır ve sonucu doğrula.
6. Değiştirilen sayfalar için gerekli rota/API kontrollerini yap.
7. Bu dosyanın **Çalışma Günlüğü** bölümüne yapılan işi, değişen ana dosyaları ve doğrulama sonucunu ekle.
8. Yalnızca ilgili dosyaları seçerek stage et. `git add .` ve `git add -A` kullanma.
9. Commit veya push işlemini yalnızca kullanıcı açıkça istediğinde yap.

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

## 8. Tamamlanmış sayılma kriteri

Bir iş ancak aşağıdakiler tamamlandığında bitmiş kabul edilir:

- İstenen davranış uygulanmıştır.
- Proje başarıyla derlenmiştir.
- İlgili rota veya API kontrol edilmiştir.
- Mobil ve erişilebilirlik etkisi değerlendirilmiştir.
- Bu dosyadaki çalışma günlüğü güncellenmiştir.
- Kullanıcıya ne yapıldığı ve varsa kalan kararlar açıkça bildirilmiştir.

## 9. Çalışma Günlüğü

### 2026-08-20 — GitHub proje kurulumu ve ilk iyileştirmeler

- `umtco12/kozawebsite` deposunun `main` branch'i `APP/KOZA` altında aktif proje yapıldı.
- Eski Koza projesi, raporlar ve tasarım dosyaları `APP/KOZA_BACKUP_20260820` klasörüne ayrıldı.
- Aktif proje içindeki eski rapor ve yedek kalıntıları temizlendi.
- Ana sayfadaki sabit tarih İstanbul saat dilimine göre dinamik hale getirildi.
- SEO metadata temeli düzenlendi; canonical taban alan adı, Open Graph ve X/Twitter paylaşım görseli tanımlandı.
- Haber kartlarına hafif etkileşim, klavye odak görünümü ve azaltılmış hareket desteği eklendi.
- Ana sayfa, `/admin` ve `/api/content` başarılı yanıt verdi.
- `npm run build` başarılı tamamlandı.

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
