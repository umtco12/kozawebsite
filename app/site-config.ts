/* Kurumsal sayfa metinleri ve dış bağlantı yapılandırması. Değişken bilgiler (canlı yayın adresi,
   sosyal hesaplar, künye/iletişim alanları) yönetim panelindeki Site Ayarları ekranından gelir;
   bu dosya yalnızca sabit metinleri ve bilgilerin sayfaya nasıl yerleştiğini tanımlar. */

export type SocialLink = { label: string; short: string; href: string };
type Settings = Record<string, string>;

/* Adresi tanımlanmayan hesap bağlantı olarak değil düz metin olarak gösterilir; yanlış adrese
   tıklatmamak için kasıtlı davranıştır. */
export function socialLinks(settings: Settings): SocialLink[] {
  return [
    { label: "Facebook", short: "f", href: settings.socialFacebook ?? "" },
    { label: "X", short: "𝕏", href: settings.socialX ?? "" },
    { label: "YouTube", short: "▶", href: settings.socialYoutube ?? "" },
    { label: "Instagram", short: "◎", href: settings.socialInstagram ?? "" },
  ];
}

export function liveStream(settings: Settings) {
  return {
    hlsUrl: settings.liveHlsUrl ?? "",
    backupUrl: settings.liveBackupUrl ?? "",
    posterImage: "/news/studio.jpg",
    satellite: settings.satelliteInfo ?? "",
    platforms: settings.platformInfo ?? "",
  };
}

export type CorporatePage = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  sections: { heading: string; paragraphs: string[]; items?: string[] }[];
  facts?: { label: string; value: string }[];
  contact?: { label: string; value: string }[];
};

export const corporateSlugs = ["hakkimizda", "kunye", "yayin-ilkeleri", "iletisim", "kvkk", "gizlilik", "cerez-politikasi"] as const;
export const corporateTitles: Record<string, string> = {
  hakkimizda: "Hakkımızda",
  kunye: "Künye",
  "yayin-ilkeleri": "Yayın İlkeleri",
  iletisim: "İletişim",
  kvkk: "KVKK Aydınlatma Metni",
  gizlilik: "Gizlilik Politikası",
  "cerez-politikasi": "Çerez Politikası",
};

const pending = "Bilgi yönetim panelinden tanımlanacak";

export function corporatePages(settings: Settings): CorporatePage[] {
  const legalName = settings.legalName || "Koza TV";
  const privacyContact = settings.contactEmail || settings.kepAddress || "kurumsal iletişim kanalları";
  const contactRows = [
    { label: "Haber merkezi", value: settings.newsEmail ?? "" },
    { label: "Reklam ve iş birliği", value: settings.adsEmail ?? "" },
    { label: "Kurumsal iletişim", value: settings.contactEmail ?? "" },
    { label: "Telefon", value: settings.phone ?? "" },
    { label: "Adres", value: settings.address ?? "" },
    { label: "Uydu yayını", value: settings.satelliteInfo ?? "" },
  ].filter((row) => row.value);

  return [
    {
      slug: "hakkimizda",
      title: corporateTitles.hakkimizda,
      kicker: "KOZA TV",
      description: "2010 yılında Adana'da yayın hayatına başlayan Koza TV; tarafsız, güvenilir ve renkli yayınlarıyla izleyicilerine ulaşır.",
      sections: [
        {
          heading: "Koza TV",
          paragraphs: [
            "Akdeniz'in bir numarası sloganıyla yayın akışına devam eden Koza TV, büyük bir ilgi ve beğeniyle izlenmektedir. 2010 yılında yayın hayatına başlayan Adana merkezli televizyon kanalı; Adana, Antalya ve İstanbul'daki modern stüdyolarıyla kendini geliştirirken gündemi ve basın dünyasındaki yenilikleri yakından takip etmektedir.",
            "Habercilik alanındaki tarafsız ve güvenilir yayınları, özellikle ana haber bültenleriyle dikkat çeken Koza TV; izleyicilerinin beklentileri doğrultusunda yarışma ve eğlence programlarına da yer verir.",
          ],
        },
        {
          heading: "Güncel ve Renkli Programlar Koza TV'de",
          paragraphs: [
            "Koza TV, zengin program içeriğiyle her yaş grubundan izleyicisini ekranlara çağırır. Eğlence, yarışma, haber, sabah programları ve film kuşağından oluşan yayın seçkisi yeni programlarla sürekli gelişir.",
            "Adana'da kurulan kanal yalnız Akdeniz Bölgesi'ni değil, Türkiye ve dünya gündemini de yakından takip eder; önemli gelişmeleri izleyicilerine hızla aktarır.",
          ],
        },
        {
          heading: "Kültür, sanat ve spor",
          paragraphs: [
            "Koza TV programlarında spor önemli bir yere sahiptir. Ata sporlarına ayrı bir değer verilir; özellikle yağlı güreş karşılaşmaları izleyiciyle buluşturulur.",
            "Akdeniz Bölgesi'ne özgü kültürel ve sanatsal etkinlikler ile festivaller ekranlardan tanıtılır. Koza TV, ulusal yayın kalitesini yerel değerlerle birleştirerek bölgenin kültürünü ve yöresel etkinliklerini görünür kılmayı görev edinir.",
          ],
        },
        {
          heading: "Koza TV Yayın Bilgileri",
          paragraphs: [
            `Koza TV'nin güncel uydu bilgisi ${settings.satelliteInfo || "yayın ayarlarında"}; platform bilgisi ise ${settings.platformInfo || "platform duyurularında"} yer almaktadır. Yayın, Koza TV'nin resmî YouTube kanalı ve dijital yayın kanalları üzerinden de takip edilebilir.`,
          ],
        },
      ],
    },
    {
      slug: "kunye",
      title: corporateTitles.kunye,
      kicker: "KURUMSAL",
      description: "Koza TV'nin yayın sorumluları, yönetim yeri ve resmî iletişim bilgileri.",
      facts: [
        { label: "KOZATV.COM.TR Genel Yayın Yönetmeni", value: settings.newsDirector ?? "" },
        { label: "Yayıncı", value: settings.legalName ?? "" },
        { label: "Sorumlu Yazı İşleri Müdürü", value: settings.responsibleManager ?? "" },
        { label: "Yönetim yeri", value: settings.address ?? "" },
        { label: "İletişim telefonu", value: settings.phone ?? "" },
        { label: "Kurumsal e-posta", value: settings.contactEmail ?? "" },
        { label: "Koza TV kayıtlı KEP adresi", value: settings.kepAddress ?? "" },
        { label: "Ulusal Elektronik Tebligat Sistemi", value: settings.uetsAddress ?? "" },
        { label: "Yer sağlayıcı ticaret unvanı ve adresi", value: settings.hostingProviderInfo ?? "" },
      ],
      sections: [],
    },
    {
      slug: "yayin-ilkeleri",
      title: corporateTitles["yayin-ilkeleri"],
      kicker: "EDİTORYAL",
      description: "Koza TV'nin haber ve yayın faaliyetlerinde benimsediği temel yayın ilkeleri.",
      sections: [
        {
          heading: "Yayın ilkelerimiz",
          paragraphs: [
            "Basın kuruluşları ve basın mensupları çalışmalarında hukukun genel kurallarına uymakla yükümlüdür. Basın Konseyi'nin benimseyip ilan ettiği temel ilkeler, Koza TV'nin yayın anlayışının da esasını oluşturur.",
          ],
        },
        {
          heading: "Bizim de kabul ettiğimiz temel ilkeler",
          paragraphs: [],
          items: [
            "Yayınlarda hiç kimseyi ırkı, cinsiyeti, yaşı, sağlığı, bedensel engeli, sosyal düzeyi veya dinî inançları nedeniyle kınamamak ve aşağılamamak.",
            "Düşünce, vicdan ve ifade özgürlüğünü sınırlayıcı; genel ahlak anlayışını, din duygularını ve aile kurumunun temel dayanaklarını sarsıcı ya da incitici yayın yapmamak.",
            "Kamusal bir görev olan gazeteciliği ahlaka aykırı özel amaç ve çıkarlara alet etmemek.",
            "Kişileri ve kuruluşları eleştiri sınırlarının ötesinde küçük düşüren, aşağılayan veya iftira niteliği taşıyan ifadelere yer vermemek.",
            "Kişilerin özel yaşamını, kamu çıkarlarının gerektirdiği durumlar dışında yayın konusu yapmamak.",
            "Gazetecilik olanakları içinde araştırılabilecek haberleri araştırmadan veya doğruluğundan emin olmadan yayımlamamak.",
            "Saklı kalması kaydıyla verilen bilgileri, kamu yararı ciddi biçimde gerektirmedikçe yayımlamamak.",
            "Başka bir basın organının özel çabayla hazırladığı ürünü kendi ürünü gibi sunmamak; ajanslardan alınan özel ürünlerin kaynağını belirtmek.",
            "Suçlu olduğu yargı kararıyla belirlenmedikçe hiç kimseyi suçlu ilan etmemek.",
            "Yasaların suç saydığı eylemleri, gerçek olduğuna ilişkin inandırıcı ve makul nedenler bulunmadıkça kimseye atfetmemek.",
            "Gazetecinin kaynaklarının gizliliğini korumak; kaynağın kamuoyunu yanıltmayı amaçladığı durumları bunun dışında değerlendirmek.",
            "Gazetecilik görevini, mesleğin saygınlığına gölge düşürebilecek yöntem ve tutumlarla yürütmemek.",
            "Şiddet ve zorbalığı özendirici, insani değerleri incitici yayınlardan kaçınmak.",
            "İlan ve reklam niteliğindeki yayınların bu niteliğini tereddüde yer bırakmayacak biçimde belirtmek.",
            "Yayın tarihi için konulan zaman kaydına saygı göstermek.",
            "Yanlış yayınlardan kaynaklanan cevap ve tekzip hakkına saygı göstermek.",
          ],
        },
        {
          heading: "Düzeltme ve yanıt hakkı",
          paragraphs: [
            "Hatalı bilgi tespit edildiğinde gerekli düzeltme açıkça yapılır. Haberde adı geçen kişi ve kurumların cevap ve tekzip hakkına saygı gösterilir; başvurular İletişim sayfasındaki kanallardan iletilebilir.",
          ],
        },
      ],
    },
    {
      slug: "iletisim",
      title: corporateTitles.iletisim,
      kicker: "BİZE ULAŞIN",
      description: "Haber ihbarı, düzeltme talebi, reklam ve kurumsal başvurular için iletişim kanalları.",
      sections: [
        {
          heading: "Haber ihbar hattı",
          paragraphs: [
            "Gelişmeleri ve belgeleri Haber Merkezi'ne iletebilirsiniz. İhbar sahibinin kimliği, aksi talep edilmedikçe gizli tutulur.",
          ],
        },
        {
          heading: "Sosyal medya",
          paragraphs: [
            socialLinks(settings).some((item) => item.href)
              ? "Resmî sosyal medya hesaplarımıza site üst ve alt bölümündeki simgelerden ulaşabilirsiniz."
              : "Koza TV resmî sosyal medya hesap adresleri tanımlandığında bu sayfada ve site alt bölümünde bağlantı olarak yayımlanacaktır.",
          ],
        },
      ],
      contact: contactRows.length ? contactRows : [{ label: "İletişim bilgileri", value: pending }],
    },
    {
      slug: "kvkk",
      title: corporateTitles.kvkk,
      kicker: "HUKUKİ",
      description: "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında veri işleme esasları.",
      sections: [
        {
          heading: "Veri sorumlusu ve kapsam",
          paragraphs: [
            `6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca ${legalName}, kişisel verilerin güvenliğine azami özen gösterir. Bu aydınlatma metni, Koza TV internet sitesi ve kurumsal iletişim kanalları kapsamında işlenen veriler hakkında bilgi verir.`,
          ],
        },
        {
          heading: "Kişisel verilerinize ilişkin",
          paragraphs: [
            "KVKK uyarınca kimliği belirli veya belirlenebilir gerçek kişiye ilişkin her türlü bilgi kişisel veridir. Site ziyaretinde güvenlik için gerekli teknik kayıtlar; iletişim veya haber ihbarı sırasında ise kişinin kendi isteğiyle paylaştığı ad, iletişim bilgisi, mesaj ve ekler işlenebilir.",
            "Yönetim paneli kullanıcılarının kimlik, yetki, oturum ve işlem kayıtları; erişim güvenliği, içerik bütünlüğü ve denetim amacıyla sınırlı süreyle saklanır.",
          ],
        },
        {
          heading: "Kişisel verilerin kimlerle paylaşılacağına ilişkin",
          paragraphs: [
            "Kişisel veriler; hizmetin yürütülmesi için gerekli olduğu ölçüde yetkili hizmet sağlayıcılarla ve hukuken geçerli bir talep bulunması halinde yetkili kamu kurumlarıyla, KVKK'nın 8 ve 9. maddelerindeki şartlara uygun olarak paylaşılabilir.",
          ],
        },
        {
          heading: "Kişisel verilerinizi toplama yöntemi ve hukuki sebebine ilişkin",
          paragraphs: [
            "Kişisel veriler internet sitesi, yönetim paneli ve kurumsal iletişim kanalları üzerinden elektronik ortamda toplanır; KVKK'nın 5 ve 6. maddelerinde belirtilen işleme şartları, hukuki yükümlülükler, meşru menfaat veya gerekli olduğu durumda açık rıza temelinde işlenir.",
          ],
        },
        {
          heading: "Kişisel verilerinize yönelik haklarınıza ilişkin",
          paragraphs: [
            "KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:",
          ],
          items: [
            "Kişisel veri işlenip işlenmediğini öğrenme.",
            "Kişisel veriler işlenmişse buna ilişkin bilgi talep etme.",
            "Kişisel verilerin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.",
            "Kişisel verilerin yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.",
            "Eksik veya yanlış işlenen kişisel verilerin düzeltilmesini isteme.",
            "Kanunda öngörülen şartlar çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme ve bu işlemlerin verilerin aktarıldığı üçüncü kişilere bildirilmesini talep etme.",
            "İşlenen verilerin yalnız otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonucun ortaya çıkmasına itiraz etme.",
            "Kişisel verilerin kanuna aykırı işlenmesi nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme.",
          ],
        },
        {
          heading: "Başvuru",
          paragraphs: [
            `KVKK kapsamındaki taleplerinizi kimliğinizi doğrulayacak bilgilerle birlikte ${privacyContact} üzerinden iletebilirsiniz. Başvurular mevzuatta öngörülen süre içinde değerlendirilir.`,
          ],
        },
        {
          heading: "Kişisel verilere ilişkin iletişim izni",
          paragraphs: [
            "Koza TV, ticari elektronik ileti veya tanıtım mesajını yalnız açık rıza verilmişse ya da mevzuatın izin verdiği hallerde gönderir. Verilen iletişim izni her zaman geri alınabilir.",
          ],
        },
      ],
    },
    {
      slug: "gizlilik",
      title: corporateTitles.gizlilik,
      kicker: "HUKUKİ",
      description: "Koza TV internet sitesinin kullanımına, içeriklere ve kullanıcı gizliliğine ilişkin esaslar.",
      sections: [
        {
          heading: "Kullanım Şartları",
          paragraphs: [
            "Koza TV internet sitesini ziyaret eden kullanıcılar Türkiye Cumhuriyeti mevzuatına ve bu sayfada açıklanan kullanım koşullarına uygun davranmayı kabul eder.",
          ],
          items: [
            "Hukuka aykırı, tehdit, taciz, hakaret, nefret söylemi, ayrımcılık, şiddete teşvik veya spam niteliğindeki içerik ve iletiler kabul edilmez.",
            "Siteyi, sunucuları veya diğer kullanıcıları etkileyebilecek zararlı yazılım gönderme, yetkisiz erişim denemesi ve hizmeti engelleme girişimleri yasaktır.",
            "Koza TV, hukuka veya yayın ilkelerine aykırı iletileri değerlendirmeme ve gerekli hallerde yetkili mercilere bildirme hakkını saklı tutar.",
          ],
        },
        {
          heading: "Fikri ve sınai mülkiyet",
          paragraphs: [
            "Sitede yayımlanan yazı, fotoğraf, video, ses, grafik, logo, tasarım ve yazılımlar üzerindeki haklar Koza TV'ye veya ilgili hak sahiplerine aittir. İçerikler, hak sahibinin izni veya kanunun açıkça izin verdiği haller dışında çoğaltılamaz, yayımlanamaz, değiştirilemez ya da ticari amaçla kullanılamaz.",
            "İçerikten makul ölçüde alıntı yapılması; kaynağın açıkça belirtilmesi ve ilgili Koza TV sayfasına bağlantı verilmesi koşuluyla mümkündür. İçeriğin tamamı yazılı izin olmadan kullanılamaz.",
          ],
        },
        {
          heading: "Teknik kayıtlar ve veri güvenliği",
          paragraphs: [
            "Sitenin güvenliğini, sürekliliğini ve hata takibini sağlamak amacıyla IP adresi, tarayıcı türü, bağlantı zamanı ve benzeri sınırlı teknik kayıtlar tutulabilir. Bu kayıtlar amaçla bağlantılı ve ölçülü sürelerle saklanır.",
            "Yönetim paneli erişimi rol bazlı yetkilendirme, süreli oturum ve hatalı giriş korumasıyla sınırlandırılır. İçerik ve medya verileri düzenli olarak yedeklenir; yedeklerin bütünlüğü doğrulanır.",
          ],
        },
        {
          heading: "Üçüncü taraf hizmetler ve bağlantılar",
          paragraphs: [
            "Sitede üçüncü taraf internet sitelerine veya gömülü hizmetlere bağlantı verilebilir. Bu hizmetlerin içerik ve gizlilik uygulamaları kendi sorumluluklarındadır; bağlantıyı açmadan önce ilgili hizmetin koşulları incelenmelidir.",
            "Zorunlu olmayan ölçümleme veya reklam araçları etkinleştirildiğinde, çerez yerleştirilmeden önce gerekli ziyaretçi tercihi alınır.",
          ],
        },
        {
          heading: "Değişiklikler",
          paragraphs: [
            "Koza TV, hizmetlerin veya mevzuatın değişmesi halinde bu metni güncelleyebilir. Güncel metin her zaman bu sayfada yayımlanır.",
          ],
        },
      ],
    },
    {
      slug: "cerez-politikasi",
      title: corporateTitles["cerez-politikasi"],
      kicker: "HUKUKİ",
      description: "Sitede kullanılan çerezler ve tercih yönetimi.",
      sections: [
        {
          heading: "Çerezler (Cookie)",
          paragraphs: [
            "Çerezler, internet sitesini ziyaret ettiğinizde tarayıcınız tarafından cihazınıza kaydedilebilen küçük tanımlama dosyalarıdır. Geçici çerezler oturum sona erdiğinde silinir; kalıcı çerezler ise belirlenen süre boyunca veya kullanıcı tarafından silinene kadar cihazda kalabilir.",
          ],
        },
        {
          heading: "Kullandığımız çerezler",
          paragraphs: [
            "Yönetim paneli oturum çerezi yalnızca yetkili kullanıcı girişi için kullanılır ve HttpOnly ile SameSite korumalarıyla oluşturulur. Ziyaretçi tarafında haberleri okumak için isteğe bağlı çerezleri kabul etmek gerekmez.",
            "Ölçümleme veya reklam amaçlı zorunlu olmayan çerezler devreye alındığında ziyaretçiye açık bir tercih sunulur ve bu tercih sonradan değiştirilebilir.",
          ],
        },
        {
          heading: "Tercihlerinizi yönetme",
          paragraphs: [
            "Çerezlerin cihazınızda saklanmasını istemiyorsanız tarayıcınızın ayarlar bölümünden çerez kullanım tercihlerinizi değiştirebilir, mevcut çerezleri silebilir veya belirli siteler için engelleme uygulayabilirsiniz. Menü adları tarayıcıya göre değişebilir; ayrıntılı bilgi tarayıcının yardım bölümünde yer alır.",
          ],
        },
      ],
    },
  ];
}

export function getCorporatePage(settings: Settings, slug: string) {
  return corporatePages(settings).find((page) => page.slug === slug) ?? null;
}
