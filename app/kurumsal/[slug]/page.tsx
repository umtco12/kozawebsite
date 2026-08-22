import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirectIfMapped } from "../../legacy-redirect";
import { SiteFooter, SiteHeader, navCategories } from "../../site-chrome";
import { getSiteSettings } from "../../../db";
import { corporateSlugs, corporateTitles, getCorporatePage } from "../../site-config";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getCorporatePage(getSiteSettings(), slug);
  if (!page) return { title: "Sayfa bulunamadı", robots: { index: false } };
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/kurumsal/${page.slug}` },
    openGraph: { title: page.title, description: page.description, url: `/kurumsal/${page.slug}` },
  };
}

export default async function CorporatePageView({ params }: Props) {
  const { slug } = await params;
  const categories = navCategories();
  const page = getCorporatePage(getSiteSettings(), slug);

  if (!page) { redirectIfMapped(`/kurumsal/${slug}`); notFound(); }

  return (
    <main className="category-page static-page">
      <SiteHeader categories={categories} />
      <section className="category-hero">
        <div className="wrap">
          <span>{page.kicker}</span>
          <h1>{page.title}</h1>
          <p>{page.description}</p>
        </div>
      </section>
      <div className="wrap static-layout">
        <article className="static-body">
          {page.facts && (
            <section className="static-contact">
              <h2>Yayın kuruluşu bilgileri</h2>
              <dl>{page.facts.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value.includes("@") ? <a href={`mailto:${row.value}`}>{row.value}</a> : row.value}</dd></div>)}</dl>
            </section>
          )}
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}
            </section>
          ))}
          {page.contact && (
            <section className="static-contact">
              <h2>İletişim kanalları</h2>
              <dl>{page.contact.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value.includes("@") ? <a href={`mailto:${row.value}`}>{row.value}</a> : row.value}</dd></div>)}</dl>
            </section>
          )}
        </article>
        <aside className="static-aside">
          <strong>Kurumsal sayfalar</strong>
          {corporateSlugs.map((item) => (
            <a href={`/kurumsal/${item}`} key={item} className={item === page.slug ? "active" : ""}>{corporateTitles[item]}</a>
          ))}
          <a href="/canli" className="static-live">Canlı yayını izle →</a>
        </aside>
      </div>
      <SiteFooter categories={categories} />
    </main>
  );
}
