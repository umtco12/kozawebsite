import type { Metadata } from "next";
import { listAuthors } from "../../db";
import { SiteFooter, SiteHeader, navCategories } from "../site-chrome";
import { displayTitle } from "../../db/title-model.mjs";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Yazarlar ve Haber Servisleri",
  description: "Koza TV köşe yazarları, haber servisleri ve imzalarına ait haber arşivi.",
  alternates: { canonical: "/yazarlar" },
  openGraph: { title: "Koza TV Yazarları", description: "Köşe yazarları ve haber servisleri.", url: "/yazarlar" },
};

export default async function Writers() {
  const categories = navCategories();
  const authors = listAuthors();

  return (
    <main className="category-page">
      <SiteHeader categories={categories} active="yazarlar" />
      <section className="category-hero">
        <div className="wrap">
          <span>KOZA TV İMZALAR</span>
          <h1>Yazarlar ve Servisler</h1>
          <p>Haberlerin arkasındaki imzalar. Bir isme tıkladığınızda o imzaya ait bütün haberleri görürsünüz.</p>
          <small>{authors.length} aktif imza</small>
        </div>
      </section>
      <div className="wrap author-grid">
        {authors.length ? authors.map((author) => (
          <a className="author-card" href={`/yazar/${author.slug}`} key={author.slug}>
            <div className="avatar">{author.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
            <div>
              <h2>{author.name}</h2>
              <p>{displayTitle(author.latestTitle) || "Yayınlanmış haber bekleniyor"}</p>
              <span className="author-count">{author.articleCount} haber · {author.topCategory}</span>
            </div>
          </a>
        )) : (
          <div className="category-empty"><h2>Henüz yayınlanmış imza yok.</h2><a href="/">Ana sayfaya dön →</a></div>
        )}
      </div>
      <SiteFooter categories={categories} />
    </main>
  );
}
