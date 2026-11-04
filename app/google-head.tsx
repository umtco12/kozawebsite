"use client";

import { usePathname } from 'next/navigation';
import { isGoogleVisitorHost, isGoogleVisitorPath } from './google-consent.mjs';

type Props = {
  config: { publisherId: string; advertisingEnabled: boolean };
  hostname: string;
  bootstrap: string;
};

export function GoogleAdSenseHead({ config, hostname, bootstrap }: Props) {
  const pathname = usePathname() || '/';
  const enabled = config.publisherId && config.advertisingEnabled
    && isGoogleVisitorHost(hostname) && isGoogleVisitorPath(pathname);
  return <>
    {config.publisherId && <meta name="google-adsense-account" content={config.publisherId} />}
    {enabled && <>
      <script id="koza-google-bootstrap" dangerouslySetInnerHTML={{ __html: bootstrap }} />
      {/* onLoad, React'in async scripti izin başlangıcının önüne taşımasını önler. */}
      <script id="koza-adsense" async src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.publisherId}`} crossOrigin="anonymous" onLoad={() => undefined} />
    </>}
  </>;
}
