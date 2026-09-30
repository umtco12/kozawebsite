export const CONSENT_KEY = 'koza_cookie_consent_v1';
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export function isGoogleVisitorPath(path) { return !/^\/(admin|api|_next|media)(\/|$)/i.test(path); }

/* Basic consent mode: izin öncesinde GTM/Analytics veya reklam kodu indirilmez.
   Reklamın TCF ve ad_* izinlerini AdSense'in sertifikalı Google CMP'si yönetir. */
export function createGoogleConsent({ window, document, config }) {
  let initialized = false, previous = null;
  const loaded = new Set();
  const visitor = () => isGoogleVisitorPath(window.location.pathname);
  const productionHost = () => /^(www\.)?kozatv\.com\.tr$/.test(window.location.hostname);
  function command() { window.dataLayer.push(arguments); }
  function initialize() {
    if (initialized) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || command;
    command('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    command('set', 'ads_data_redaction', true);
    initialized = true;
  }
  function load(key, src) {
    if (loaded.has(key) || document.getElementById?.(key)) return;
    const script = document.createElement('script');
    script.id = key; script.async = true; script.src = src;
    if (key === 'koza-adsense') script.crossOrigin = 'anonymous';
    document.head.appendChild(script); loaded.add(key);
  }
  function clearAnalyticsCookies() {
    for (const part of document.cookie.split(';')) {
      const name = part.split('=')[0].trim();
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) continue;
      for (const domain of ['', window.location.hostname, '.kozatv.com.tr']) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
    }
  }
  function restore() {
    try {
      const stored = JSON.parse(window.localStorage.getItem(CONSENT_KEY)), age = Date.now() - stored?.savedAt;
      if (stored?.version !== 1 || typeof stored.analytics !== 'boolean' || typeof stored.advertising !== 'boolean' || !Number.isFinite(age) || age < 0 || age > CONSENT_MAX_AGE) return null;
      return { analytics: stored.analytics, advertising: stored.advertising };
    } catch { return null; }
  }
  function apply(choice, { persist = true, reloadOnRevoke = false } = {}) {
    const value = { analytics: choice.analytics === true, advertising: choice.advertising === true };
    if (!visitor()) return value;
    initialize();
    command('consent', 'update', { analytics_storage: value.analytics ? 'granted' : 'denied', ...(!value.advertising ? { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' } : {}) });
    if (value.analytics && config.gtmId && productionHost()) {
      if (!loaded.has('koza-gtm') && !document.getElementById?.('koza-gtm')) window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
      load('koza-gtm', `https://www.googletagmanager.com/gtm.js?id=${config.gtmId}`);
    }
    if (value.advertising && config.advertisingEnabled && config.publisherId && productionHost()) load('koza-adsense', `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${config.publisherId}`);
    if (!value.analytics) clearAnalyticsCookies();
    if (persist) { try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ ...value, version: 1, savedAt: Date.now() })); } catch { /* Sonraki ziyarette yeniden sorulur. */ } }
    const revoked = previous && ((previous.analytics && !value.analytics) || (previous.advertising && !value.advertising));
    previous = value;
    if (revoked && reloadOnRevoke) window.location.reload();
    return value;
  }
  function manageAdvertising() {
    if (!visitor() || !productionHost() || !config.advertisingEnabled || !config.publisherId) return false;
    apply({ analytics: previous?.analytics === true, advertising: true });
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push({ CONSENT_API_READY: () => window.googlefc.showRevocationMessage() });
    return true;
  }
  return { restore, apply, manageAdvertising };
}
