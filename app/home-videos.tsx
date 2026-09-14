import { listVideoArticles } from "../db";
import { KOZA_YOUTUBE_VIDEOS_URL, loadKozaYouTubeVideos } from "../db/youtube-feed.mjs";
import { displayTitle } from "../db/title-model.mjs";
import { VideoThumbnail } from "./video-thumbnail";
import "./home-videos.css";

export async function HomeVideos() {
  const youtube = await loadKozaYouTubeVideos();
  const isYouTube = youtube.length > 0;
  const videos = isYouTube ? youtube.map((video) => ({ ...video, label: "YOUTUBE", alt: video.title }))
    : listVideoArticles(4).map((article) => ({ id: String(article.id), title: displayTitle(article.title), href: `/haber/${article.slug}`, image: article.heroImage, alt: article.imageAlt, label: article.category }));
  const [lead, ...rest] = videos;
  const target = isYouTube ? { target: "_blank", rel: "noopener noreferrer" } : {};
  return (
    <section className="video-section" id="video" aria-label="Koza TV videoları" data-video-source={isYouTube ? "youtube" : "site"}>
      <div className="wrap">
        <div className="section-head light"><div><span>KOZA TV YOUTUBE</span><h2>İzle</h2></div><a href={isYouTube ? KOZA_YOUTUBE_VIDEOS_URL : "/videolar"} {...target}>Tüm Videolar →{isYouTube && <span className="visually-hidden"> (YouTube, yeni sekme)</span>}</a></div>
        <div className={`video-grid${rest.length ? "" : " video-grid-single"}`}>
          {lead ? (
            <a className="video-main" href={lead.href} {...target}>
              <VideoThumbnail src={isYouTube ? lead.image.replace("hqdefault.jpg", "maxresdefault.jpg") : lead.image} fallbackSrc={lead.image} alt={lead.alt} />
              <i aria-hidden="true">▶</i>
              <div><span>{lead.label}</span><h3>{lead.title}</h3></div>
            </a>
          ) : (
            <a className="video-main" href="/canli">
              <VideoThumbnail src="/news/gorsel-yok.svg" alt="Koza TV canlı yayını" />
              <i aria-hidden="true">▶</i>
              <div><span>CANLI</span><h3>Koza TV canlı yayınını izleyin</h3></div>
            </a>
          )}
          {rest.length > 0 && <div className="video-list">
            {rest.map((video) => (
              <a href={video.href} key={video.id} {...target}>
                <div><VideoThumbnail src={video.image} alt={video.alt} /><i aria-hidden="true">▶</i></div>
                <p><span>{video.label}</span>{video.title}</p>
              </a>
            ))}
          </div>}
        </div>
      </div>
    </section>
  );
}
