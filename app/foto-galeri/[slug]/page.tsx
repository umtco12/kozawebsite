import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPhotoGalleryBySlug, listCategories } from "../../../db";
import { displayTitle } from "../../../db/title-model.mjs";
import { SiteFooter, SiteHeader } from "../../site-chrome";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gallery = getPhotoGalleryBySlug((await params).slug);
  if (!gallery) return { title: "Foto galeri bulunamadı", robots: { index: false } };
  const title = `${displayTitle(gallery.title)} | Foto Galeri`;
  return { title, description: gallery.seoDescription || gallery.spot, alternates: { canonical: `/foto-galeri/${gallery.slug}` }, openGraph: { title, description: gallery.seoDescription || gallery.spot, url: `/foto-galeri/${gallery.slug}`, images: [{ url: gallery.galleryImages[0].src }] } };
}

export default async function PhotoGalleryDetail({ params }: Props) {
  const gallery = getPhotoGalleryBySlug((await params).slug);
  if (!gallery) notFound();
  const categories = listCategories(true).map(({ id, name, slug }) => ({ id, name, slug }));
  const articleHref = `/haber/${gallery.slug}`;

  return (
    <main className="photo-gallery-detail-page">
      <SiteHeader categories={categories} active="foto-galeri" />
      <article className="wrap photo-gallery-detail">
        <header><a href="/foto-galeri">← Foto Galeri</a><span>{gallery.category}</span><h1>{displayTitle(gallery.title)}</h1>{gallery.spot ? <p>{gallery.spot}</p> : null}<div><a href={articleHref}>Haberi oku ↗</a></div></header>
        <section className="photo-gallery-frames" aria-label={`${displayTitle(gallery.title)} fotoğrafları`}>
          {gallery.galleryImages.map((image, index) => <figure id={`fotograf-${index + 1}`} key={image.src}>
            <div><img src={image.src} alt={image.caption || `${displayTitle(gallery.title)} — ${index + 1}. fotoğraf`} loading={index === 0 ? "eager" : "lazy"} /><span>{String(index + 1).padStart(2, "0")} / {String(gallery.galleryImages.length).padStart(2, "0")}</span></div>
            {image.caption ? <figcaption>{image.caption}</figcaption> : null}
          </figure>)}
        </section>
        <footer><a href="/foto-galeri">Diğer foto galeriler →</a><a href={articleHref}>Haberin tamamını oku →</a></footer>
      </article>
      <SiteFooter categories={categories} />
    </main>
  );
}
