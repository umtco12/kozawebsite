/* Ziyaretçi sitesinin kurumsal içeriği ve dış bağlantı yapılandırması. Gerçek hesap/yayın adresleri
   verildiğinde yalnızca bu dosya güncellenir; sayfalar ve menüler otomatik olarak bağlantıya döner. */

export type SocialLink = { label: string; short: string; href: string };

/* Boş `href` bırakılan hesap bağlantı olarak değil düz metin olarak gösterilir; yanlış adrese
   tıklatmamak için kasıtlı davranıştır. */
export const socialLinks: SocialLink[] = [
  { label: "Facebook", short: "f", href: "" },
  { label: "X", short: "𝕏", href: "" },
  { label: "YouTube", short: "▶", href: "" },
  { label: "Instagram", short: "◎", href: "" },
];

/* Canlı yayın kaynağı tanımlanmadığı sürece oynatıcı sahte bir yayın göstermez. */
export const liveStream = {
  hlsUrl: process.env.KOZA_LIVE_HLS_URL ?? "",
  posterImage: "/news/studio.jpg",
  satellite: "Türksat 3A • 12685 V",
  platforms: "Digitürk 614 • D-Smart 108",
};

export const broadcastSchedule = [
  { time: "07:00", title: "Koza TV Günaydın", host: "Sabah Yayın Ekibi" },
  { time: "10:00", title: "Gündem Özel", host: "Haber Merkezi" },
  { time: "12:30", title: "Öğle Bülteni", host: "Koza TV Haber" },
  { time: "16:00", title: "Piyasa Saati", host: "Ekonomi Servisi" },
  { time: "19:00", title: "Ana Haber Bülteni", host: "Koza TV Haber Merkezi" },
  { time: "21:00", title: "Konuşma Zamanı", host: "Stüdyo Yayını" },
];

export type CorporatePage = {
  slug: string;
  title: string;
  kicker: string;
  description: string;
  sections: { heading: string; paragraphs: string[] }[];
  contact?: { label: string; value: string }[];
};

export const corporatePages: CorporatePage[] = [
  {
    slug: "hakkimizda",
    title: "Hakkımızda",
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
    title: "Künye",
    kicker: "KURUMSAL",
    description: "Koza TV yayın kuruluşu bilgileri ve sorumlu birimler.",
    sections: [
      {
        heading: "Yayın kuruluşu",
        paragraphs: [
          "Yayın adı: Koza TV — Konuşma Zamanı.",
          "Yayın türü: Ulusal haber ve program yayını (uydu, kablo ve internet).",
          "Yayın merkezi bilgileri, ticari unvan ve sorumlu müdür kayıtları resmî belgelerle güncellenecektir.",
        ],
      },
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
    title: "Yayın İlkeleri",
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
    title: "İletişim",
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
          "Koza TV resmî sosyal medya hesap adresleri tanımlandığında bu sayfada ve site alt bölümünde bağlantı olarak yayımlanacaktır.",
        ],
      },
    ],
    contact: [
      { label: "Haber merkezi", value: "haber@kozatv.com.tr" },
      { label: "Reklam ve iş birliği", value: "reklam@kozatv.com.tr" },
      { label: "Kurumsal iletişim", value: "iletisim@kozatv.com.tr" },
      { label: "Uydu yayını", value: "Türksat 3A • 12685 V" },
    ],
  },
  {
    slug: "kvkk",
    title: "KVKK Aydınlatma Metni",
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
          "Kişisel verilerinize erişme, düzeltilmesini ve silinmesini isteme haklarınız bulunur. Başvurularınızı İletişim sayfasındaki kurumsal iletişim adresine iletebilirsiniz.",
          "Yönetim paneli kullanıcı kayıtları ve erişim günlükleri, güvenlik amacıyla sınırlı süreyle saklanır.",
        ],
      },
    ],
  },
  {
    slug: "gizlilik",
    title: "Gizlilik Politikası",
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
          "Site üst bölümündeki hava durumu ve döviz göstergeleri, açık veri servislerinden okunur; bu isteklerde ziyaretçiye ait kişisel veri gönderilmez.",
          "Reklam ve analitik araçları etkinleştirildiğinde, çerez yerleştirilmeden önce ziyaretçi rızası alınacaktır.",
        ],
      },
    ],
  },
  {
    slug: "cerez-politikasi",
    title: "Çerez Politikası",
    kicker: "HUKUKİ",
    description: "Sitede kullanılan çerezler ve tercih yönetimi.",
    sections: [
      {
        heading: "Zorunlu çerezler",
        paragraphs: [
          "Yönetim paneli oturum çerezi yalnızca yetkili kullanıcı girişi için kullanılır; `HttpOnly` ve `SameSite` korumalarıyla üretilir.",
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

export function getCorporatePage(slug: string) {
  return corporatePages.find((page) => page.slug === slug) ?? null;
}
