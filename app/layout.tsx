import type { Metadata } from "next";
import { Inter, Merriweather } from "next/font/google";
import "./globals.css";

const inter=Inter({variable:"--font-inter",subsets:["latin","latin-ext"]});
const merriweather=Merriweather({variable:"--font-serif",subsets:["latin","latin-ext"],weight:["700","900"]});
export const metadata: Metadata = {
  metadataBase: new URL("https://www.kozatv.com.tr"),
  title: {
    default: "Koza TV | Konuşma Zamanı",
    template: "%s | Koza TV",
  },
  description:
    "Türkiye ve dünyadan son dakika haberleri, canlı yayın, ekonomi, spor, kültür-sanat ve güçlü köşe yazıları.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Koza TV | Konuşma Zamanı",
    description:
      "Türkiye'nin gündemi, güvenilir haber ve güçlü yorumla Koza TV'de.",
    images: [{ url: "/og-v2.png", width: 1200, height: 630, alt: "Koza TV" }],
    locale: "tr_TR",
    siteName: "Koza TV",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Koza TV | Konuşma Zamanı",
    description:
      "Türkiye'nin gündemi, güvenilir haber ve güçlü yorumla Koza TV'de.",
    images: ["/og-v2.png"],
  },
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body className={`${inter.variable} ${merriweather.variable}`}>{children}</body></html>}
