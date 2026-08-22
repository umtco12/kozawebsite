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
  sections: { heading: string; paragraphs: string[] }[];
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
      description: "Koza TV; Türkiye ve dünyadaki gelişmeleri doğrulanmış bilgiyle, tarafsız ve anlaşılır biçimde aktaran ulusal bir haber ve yayın kuruluşudur.",
      sections: [
        {
          heading: "Yayın anlayışımız",
          paragraphs: [
            "Koza TV Haber Merkezi, günün gelişmelerini sahadan gelen bilgi, resmî açıklamalar ve uzman değerlendirmeleriyle birlikte ele alır. Her haber yayına alınmadan önce kaynak, doğruluk ve telif kontrolünden geçer.",
            "Televizyon yayını, internet sitesi ve dijital kanallar eş zamanlı çalışır; okur ve izleyici aynı bilgiye aynı anda ulaşır.",
          ],
        },
        {
          heading: "Haber merkezi",
          paragraphs: [
            "Muhabir, editör ve yayın yönetmeni akışında hiçbir içerik tek kişinin onayıyla yayına çıkmaz. Yapay zekâ destekli araçlar yalnızca editöre yardımcı olur; editör onayı olmayan içerik yayınlanmaz.",
          ],
        },
      ],
    },
    {
      slug: "kunye",
      title: corporateTitles.kunye,
      kicker: "KURUMSAL",
      description: "Koza TV yayın kuruluşu bilgileri ve sorumlu birimler.",
      facts: [
        { label: "Yayın adı", value: "Koza TV — Konuşma Zamanı" },
        { label: "Ticari unvan", value: settings.legalName || pending },
        { label: "Sorumlu müdür", value: settings.responsibleManager || pending },
        { label: "Haber koordinatörü", value: settings.newsDirector || pending },
        { label: "Yayın merkezi", value: settings.address || pending },
        { label: "Telefon", value: settings.phone || pending },
        { label: "İletişim", value: settings.contactEmail || pending },
        { label: "Uydu ve platform", value: [settings.satelliteInfo, settings.platformInfo].filter(Boolean).join(" • ") || pending },
      ],
      sections: [
        {
          heading: "Sorumlu birimler",
          paragraphs: [
            "Haber Merkezi, Ekonomi Servisi, Dünya Servisi, Spor Servisi ve Dijital Yayın Birimi içerik üretiminden sorumludur.",
            "Yayın hataları ve düzeltme talepleri Haber Merkezi tarafından değerlendirilir; kabul edilen düzeltmeler haberin üzerinde düzeltme notu olarak yayımlanır.",
          ],
        },
      ],
    },
    {
      slug: "yayin-ilkeleri",
      title: corporateTitles["yayin-ilkeleri"],
      kicker: "EDİTORYAL",
      description: "Koza TV'nin haber üretiminde uyduğu editoryal ilkeler ve düzeltme politikası.",
      sections: [
        {
          heading: "Temel ilkeler",
          paragraphs: [
            "Doğruluk önce gelir: Teyit edilmeyen bilgi, hız uğruna yayınlanmaz.",
            "Kaynak gösterilir: Alıntılanan bilgi, kaynağıyla birlikte ve bağlamı bozulmadan aktarılır.",
            "Tarafsızlık korunur: Haber ile yorum ayrılır; köşe yazıları yazarın görüşüdür.",
            "Kişilik hakları gözetilir: Masumiyet karinesi, özel yaşam ve çocukların korunması ilkeleri uygulanır.",
          ],
        },
        {
          heading: "Düzeltme ve yanıt hakkı",
          paragraphs: [
            "Hatalı bilgi tespit edildiğinde haber gizlice değiştirilmez; düzeltme notu haberin üzerinde açıkça belirtilir.",
            "Haberde adı geçen kişi ve kurumların yanıt hakkı vardır; başvurular İletişim sayfasındaki kanallardan iletilir.",
          ],
        },
        {
          heading: "Yapay zekâ kullanımı",
          paragraphs: [
            "Yapay zekâ araçları özet, başlık önerisi ve kaynak taramasında yardımcı olarak kullanılır.",
            "Yapay zekâ tarafından hazırlanan hiçbir metin editör onayı olmadan yayına alınmaz.",
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
          heading: "İşlenen veriler",
          paragraphs: [
            "Ziyaretçi tarafında yalnızca sitenin çalışması ve güvenliği için gereken teknik kayıtlar tutulur.",
            "Haber ihbarı veya iletişim başvurusu gönderen kişilerin paylaştığı iletişim bilgileri, yalnızca başvurunun değerlendirilmesi amacıyla kullanılır.",
          ],
        },
        {
          heading: "Haklarınız",
          paragraphs: [
            `Kişisel verilerinize erişme, düzeltilmesini ve silinmesini isteme haklarınız bulunur. Başvurularınızı ${settings.contactEmail || "kurumsal iletişim"} adresine iletebilirsiniz.`,
            "Yönetim paneli kullanıcı kayıtları ve erişim günlükleri, güvenlik amacıyla sınırlı süreyle saklanır.",
          ],
        },
      ],
    },
    {
      slug: "gizlilik",
      title: corporateTitles.gizlilik,
      kicker: "HUKUKİ",
      description: "Koza TV internet sitesinde verilerin nasıl korunduğuna ilişkin esaslar.",
      sections: [
        {
          heading: "Veri güvenliği",
          paragraphs: [
            "Yönetim paneli erişimi rol bazlı yetkilendirme, süreli oturum ve hatalı giriş koruması ile sınırlandırılmıştır.",
            "İçerik ve medya verileri düzenli olarak yedeklenir; yedeklerin bütünlüğü doğrulanır.",
          ],
        },
        {
          heading: "Üçüncü taraf servisler",
          paragraphs: [
            "Üst bilgi bandındaki döviz kuru TCMB günlük bülteninden, hava durumu ise açık veri servisinden sunucu tarafında okunur; bu isteklerde ziyaretçiye ait kişisel veri gönderilmez.",
            "Reklam ve analitik araçları etkinleştirildiğinde, çerez yerleştirilmeden önce ziyaretçi rızası alınacaktır.",
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
          heading: "Zorunlu çerezler",
          paragraphs: [
            "Yönetim paneli oturum çerezi yalnızca yetkili kullanıcı girişi için kullanılır; HttpOnly ve SameSite korumalarıyla üretilir.",
            "Ziyaretçi tarafında haber okumak için çerez kabul etmek gerekmez.",
          ],
        },
        {
          heading: "İsteğe bağlı çerezler",
          paragraphs: [
            "Ölçümleme ve reklam çerezleri devreye alındığında, ziyaretçiye açık rıza seçeneği sunulacak ve tercih değiştirilebilir olacaktır.",
          ],
        },
      ],
    },
  ];
}

export function getCorporatePage(settings: Settings, slug: string) {
  return corporatePages(settings).find((page) => page.slug === slug) ?? null;
}
