import { getActiveAdvertisement } from "../db";
import { adPlacement } from "../db/ad-model.mjs";
import { AdImage } from "./ad-image";

export function AdSlot({ placement, className = "" }: { placement: string; className?: string }) {
  const advertisement = getActiveAdvertisement(placement);
  const definition = adPlacement(placement);
  if (!advertisement || !definition) return null;
  const paidLink = advertisement.kind !== "house" || /^https:\/\//i.test(advertisement.targetUrl);

  const content = <>
    {advertisement.imageUrl ? <AdImage src={advertisement.imageUrl} alt="" /> : null}
    <div className="ad-creative-copy">
      <small>{advertisement.kind === "house" ? "KOZA TV TANITIMI" : advertisement.advertiser}</small>
      <strong>{advertisement.title}</strong>
      {advertisement.description ? <p>{advertisement.description}</p> : null}
    </div>
    {advertisement.ctaLabel && advertisement.targetUrl ? <b className="ad-creative-cta">{advertisement.ctaLabel}<i aria-hidden="true">→</i></b> : null}
  </>;

  return (
    <aside className={`ad-unit ad-${definition.shape} ad-theme-${advertisement.theme} ${advertisement.imageUrl ? "ad-has-image" : "ad-no-image"} ${className}`.trim()} aria-label={`Reklam: ${advertisement.advertiser}`} data-ad-placement={placement} data-nosnippet="">
      <div className="ad-unit-label"><span>REKLAM</span></div>
      {advertisement.targetUrl
        ? <a className="ad-creative" href={advertisement.targetUrl} rel={paidLink ? "sponsored nofollow" : undefined}>{content}</a>
        : <div className="ad-creative">{content}</div>}
    </aside>
  );
}
