"use client";
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createGoogleConsent, isGoogleVisitorPath } from './google-consent.mjs';
import './google-services.css';
type Choice = { analytics: boolean; advertising: boolean };
type Config = { gtmId: string; analyticsId: string; publisherId: string; advertisingEnabled: boolean };
export function GoogleServices({ config }: { config: Config }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState<Choice>({ analytics: false, advertising: false });
  const controller = useRef<ReturnType<typeof createGoogleConsent> | null>(null);
  const firstControl = useRef<HTMLButtonElement>(null), reopen = useRef<HTMLButtonElement>(null);
  const visitor = isGoogleVisitorPath(path || '/');
  useEffect(() => {
    if (!visitor) return;
    const consent = createGoogleConsent({ window, document, config });
    controller.current = consent;
    const saved = consent.restore();
    if (saved) consent.apply(saved, { persist: false });
    const timer = window.setTimeout(() => { if (saved) setChoice(saved); else setOpen(true); }, 0);
    return () => window.clearTimeout(timer);
  }, [config, visitor]);
  function save(value: Choice) {
    controller.current?.apply(value, { reloadOnRevoke: true });
    setChoice(value); setOpen(false); reopen.current?.focus();
  }
  if (!visitor || (!config.gtmId && !config.publisherId)) return null;
  return <>
    <button className="koza-cookie-reopen" ref={reopen} type="button" onClick={() => { setOpen(true); window.setTimeout(() => firstControl.current?.focus(), 0); }} aria-expanded={open} aria-controls="koza-cookie-panel">Çerez tercihleri</button>
    {open && <section id="koza-cookie-panel" className="koza-cookie-panel" aria-label="Çerez tercihleri">
      <div className="koza-cookie-copy"><strong>Çerez tercihleri</strong><p>Zorunlu çerezler sitenin çalışmasını sağlar. Google Analytics ile ziyaretleri ölçmek için izninizi istiyoruz. Tercihinizi istediğiniz zaman değiştirebilirsiniz.</p><a href="/kurumsal/cerez-politikasi">Çerez politikası</a> · <a href="/kurumsal/gizlilik">Gizlilik politikası</a></div>
      <div className="koza-cookie-controls">
        <label><input type="checkbox" checked={choice.analytics} onChange={event => setChoice(current => ({ ...current, analytics: event.target.checked }))} />İstatistik (Google Analytics)</label>
        {config.advertisingEnabled && <label><input type="checkbox" checked={choice.advertising} onChange={event => setChoice(current => ({ ...current, advertising: event.target.checked }))} />Google reklam tercihlerini aç</label>}
        {config.advertisingEnabled && <small>Google reklam izinleri ayrıca Google’ın rıza ekranında yönetilir. {choice.advertising && <button type="button" onClick={() => controller.current?.manageAdvertising()}>Google reklam izinlerini yönet</button>}</small>}
        <div className="koza-cookie-actions">
          <button ref={firstControl} type="button" onClick={() => save({ analytics: false, advertising: false })}>Yalnızca zorunlu</button>
          <button type="button" onClick={() => save(choice)}>Seçimlerimi kaydet</button>
          <button type="button" onClick={() => save({ analytics: true, advertising: config.advertisingEnabled })}>Tümüne izin ver</button>
        </div>
      </div>
    </section>}
  </>;
}
