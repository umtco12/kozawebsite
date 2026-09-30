import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from '../db';
import { googleConfig } from '../db/google-model.mjs';
import { GoogleServices } from './google-services';

const baseMetadata: Metadata = {
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
export function generateMetadata(): Metadata {
  const config = googleConfig(getSiteSettings());
  return { ...baseMetadata, verification: config.verification ? { google: config.verification } : {}, other: config.publisherId ? { 'google-adsense-account': config.publisherId } : {} };
}
export default function RootLayout({children}:{children:React.ReactNode}) {
  const config = googleConfig(getSiteSettings());
  return <html lang="tr"><body>{children}<GoogleServices config={config} /></body></html>;
}
