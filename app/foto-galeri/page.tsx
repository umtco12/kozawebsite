import type { Metadata } from "next";
import { listPhotoGalleries } from "../../db";
import { displaySpot, displayTitle } from "../../db/title-model.mjs";
import { SiteFooter, SiteHeader, navCategories } from "../site-chrome";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Foto Galeri",
  description: "Koza TV'nin gündemden, siyasetten, yaşamdan ve dünyadan seçtiği fotoğraf galerileri.",
  alternates: { canonical: "/foto-galeri" },
  openGraph: { title: "Koza TV Foto Galeri", description: "Gündemin öne çıkan kareleri ve görsel hikâyeler.", url: "/foto-galeri" },
};

export default async function PhotoGalleryIndex() {
  const categories = navCategories();
  const galleries = listPhotoGalleries(24);
  const [lead, ...others] = galleries;

  return (
    <main className="photo-gallery-page">
      <SiteHeader categories={categories} active="foto-galeri" />
      <section className="photo-gallery-hero">
        <div className="wrap"><span>KOZA TV GÖRSEL HABER</span><h1>Foto Galeri</h1><p>Gündemin öne çıkan kareleri, olayların içinden ayrıntılar ve Koza TV&apos;nin seçtiği görsel hikâyeler.</p></div>
      </section>

      <div className="wrap photo-gallery-shell">
        {lead ? <a className="photo-gallery-lead" href={`/foto-galeri/${lead.slug}`}>
          <div className="photo-gallery-lead-media"><img src={lead.galleryImages[0].src} alt={lead.galleryImages[0].caption || lead.imageAlt} /></div>
          <div><small>{lead.category}</small><h2>{displayTitle(lead.title)}</h2>{displaySpot(lead.spot, lead.title) ? <p>{displaySpot(lead.spot, lead.title)}</p> : null}<strong>Galeriyi aç <i aria-hidden="true">→</i></strong></div>
        </a> : <section className="photo-gallery-empty"><h2>Foto galeriler hazırlanıyor.</h2><p>Yayınlanan görsel haberler burada yer alacak.</p></section>}

        {others.length > 0 ? <section className="photo-gallery-grid" aria-label="Foto galeriler">
          {others.map((gallery) => <a className="photo-gallery-card" href={`/foto-galeri/${gallery.slug}`} key={gallery.id}>
            <div><img src={gallery.galleryImages[0].src} alt={gallery.galleryImages[0].caption || gallery.imageAlt} loading="lazy" /></div>
            <small>{gallery.category}</small><h2>{displayTitle(gallery.title)}</h2><b>Galeriyi görüntüle <i aria-hidden="true">↗</i></b>
          </a>)}
        </section> : null}
      </div>
      <SiteFooter categories={categories} />
    </main>
  );
}
