import assert from 'node:assert/strict';
import test from 'node:test';

test('Google kimlikleri gerçek hesaba bağlıdır ve script metni kabul edilmez', async () => {
  const { googleDefaults, googleConfig } = await import('../db/google-model.mjs');
  assert.equal(googleDefaults.googleTagManagerId, 'GTM-5D3KDTPX');
  assert.equal(googleDefaults.googleAnalyticsId, 'G-Q5S8DTCR9N');
  assert.equal(googleConfig(googleDefaults).publisherId, 'ca-pub-7808964787779354');
  assert.equal(googleConfig({ googleTagManagerId: '<script>alert(1)</script>', googleAdSenseId: 'pub-1' }).gtmId, '');
});

test('İzin yoksa veya yönetim sayfasındaysa Google istekleri başlamaz; izin tek yükleme yapar', async () => {
  const { createGoogleConsent, CONSENT_KEY, CONSENT_MAX_AGE } = await import('../app/google-consent.mjs');
  const { googleConfig, googleDefaults } = await import('../db/google-model.mjs');
  const scripts = [], removedCookies = [], saved = new Map();
  const window = { location: { pathname: '/', hostname: 'www.kozatv.com.tr', reload() {} }, localStorage: { getItem: k => saved.get(k), setItem: (k,v) => saved.set(k,v) }, dataLayer: [] };
  const document = { createElement: () => ({}), head: { appendChild: s => scripts.push(s) }, get cookie() { return '_ga=one; _ga_Q5S8DTCR9N=two; koza_admin_session=private'; }, set cookie(value) { removedCookies.push(value); } };
  const consent = createGoogleConsent({ window, document, config: googleConfig(googleDefaults) });
  assert.equal(consent.restore(), null);
  assert.equal(scripts.length, 0);
  consent.apply({ analytics: false, advertising: false });
  assert.equal(scripts.length, 0);
  consent.apply({ analytics: true, advertising: false });
  consent.apply({ analytics: true, advertising: false });
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /gtm.js\?id=GTM-5D3KDTPX$/);
  assert.equal(window.dataLayer[0][0], 'consent');
  assert.equal(window.dataLayer[0][1], 'default');
  assert.equal(window.dataLayer[0][2].ad_storage, 'denied');
  assert.ok(window.dataLayer.some(v => v[1] === 'update' && v[2]?.analytics_storage === 'granted'));
  consent.apply({ analytics: false, advertising: false });
  assert.ok(removedCookies.some(v => v.startsWith('_ga=')));
  assert.ok(removedCookies.every(v => !v.startsWith('koza_admin_session')));
  window.location.pathname = '/admin/giris';
  createGoogleConsent({ window, document, config: googleConfig(googleDefaults) }).apply({ analytics: true, advertising: true });
  assert.equal(scripts.length, 1);
  saved.set(CONSENT_KEY, '{bozuk');
  assert.equal(consent.restore(), null);
  saved.set(CONSENT_KEY, JSON.stringify({ version: 1, analytics: true, advertising: true, savedAt: Date.now() - CONSENT_MAX_AGE - 1 }));
  assert.equal(consent.restore(), null);
  window.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(consent.restore(), null);
  assert.doesNotThrow(() => consent.apply({ analytics: false, advertising: false }));
  window.location.pathname = '/';
  window.location.hostname = '127.0.0.1';
  createGoogleConsent({ window, document, config: googleConfig(googleDefaults) }).apply({ analytics: true, advertising: true });
  assert.equal(scripts.length, 1, 'Yerel test ziyaretleri üretim Google hesabını kirletmemeli');
});

test('Reklam scripti yalnız ziyaretçi izni ve sertifikalı Google mesajı hazırken yüklenir', async () => {
  const { createGoogleConsent } = await import('../app/google-consent.mjs');
  const { googleConfig, googleDefaults } = await import('../db/google-model.mjs');
  const scripts = [];
  const window = { location: { pathname: '/', hostname: 'www.kozatv.com.tr' }, localStorage: { getItem: () => null, setItem() {} }, dataLayer: [] };
  const document = { createElement: () => ({}), head: { appendChild: s => scripts.push(s) }, cookie: '' };
  createGoogleConsent({ window, document, config: googleConfig({ ...googleDefaults, googleAdSenseEnabled: '0' }) }).apply({ analytics: false, advertising: true });
  assert.equal(scripts.length, 0);
  const consent = createGoogleConsent({ window, document, config: googleConfig({ ...googleDefaults, googleAdSenseEnabled: '1' }) });
  consent.apply({ analytics: false, advertising: true });
  consent.apply({ analytics: false, advertising: true });
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7808964787779354');
  assert.ok(window.dataLayer.every(v => !v[2] || v[2].ad_storage !== 'granted'), 'Reklam onayını sertifikalı CMP yönetir');
  let reopened = 0;
  window.googlefc = { showRevocationMessage() { reopened++; } };
  assert.equal(consent.manageAdvertising(), true);
  window.googlefc.callbackQueue[0].CONSENT_API_READY();
  assert.equal(reopened, 1);
});
