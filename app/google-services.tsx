"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { startGoogleServices, isGoogleVisitorPath } from './google-consent.mjs';
type Config = { gtmId: string; analyticsId: string; publisherId: string; advertisingEnabled: boolean };
export function GoogleServices({ config }: { config: Config }) {
  const path = usePathname();
  const visitor = isGoogleVisitorPath(path || '/');
  useEffect(() => {
    if (visitor) startGoogleServices({ window, document, config });
  }, [config, visitor]);
  return null;
}
