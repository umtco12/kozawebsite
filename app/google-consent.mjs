export function isGoogleVisitorPath(path) { return !/^\/(admin|api|_next|media)(\/|$)/i.test(path); }

/* Site sahibinin ölçüm yapılandırması: Analytics açık başlar.
   Reklam izinlerinin güncellenmesini sertifikalı Google CMP yönetir. */
export function startGoogleServices({ window, document, config }) {
  if (!isGoogleVisitorPath(window.location.pathname) || !/^(www\.)?kozatv\.com\.tr$/.test(window.location.hostname)) return;
  if (!config.gtmId && !(config.advertisingEnabled && config.publisherId)) return;
  window.dataLayer = window.dataLayer || [];
  function command() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || command;
  if (!window.kozaGoogleConsentInitialized) {
    command('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    command('set', 'ads_data_redaction', true);
    command('set', 'allow_google_signals', false);
    command('set', 'allow_ad_personalization_signals', false);
    window.kozaGoogleConsentInitialized = true;
    // Kaldırılan özel panelin tercih kaydını ve yalnız eski Analytics çerezlerini temizle.
    try {
      if (window.localStorage.getItem('koza_cookie_consent_v1')) {
        window.localStorage.removeItem('koza_cookie_consent_v1');
        for (const part of document.cookie.split(';')) {
          const name = part.split('=')[0].trim();
          if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) continue;
          for (const domain of ['', window.location.hostname, '.kozatv.com.tr']) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
        }
      }
    } catch { /* Eski tercih temizliği engellense de ölçüm yüklenir. */ }
  }
  function load(id, src) {
    if (document.getElementById(id)) return;
    const script = document.createElement('script');
    script.id = id; script.async = true; script.src = src;
    if (id === 'koza-adsense') script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
  if (config.gtmId && !document.getElementById('koza-gtm')) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    load('koza-gtm', `https://www.googletagmanager.com/gtm.js?id=${config.gtmId}`);
  }
  if (config.advertisingEnabled && config.publisherId) {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.requestNonPersonalizedAds = 1;
    load('koza-adsense', `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.publisherId}`);
  }
}
