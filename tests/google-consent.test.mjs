import assert from 'node:assert/strict';
import test from 'node:test';

test('Google kimlikleri gerçek hesaba bağlıdır ve script metni kabul edilmez', async () => {
  const { googleDefaults, googleConfig } = await import('../db/google-model.mjs');
  assert.equal(googleDefaults.googleTagManagerId, 'GTM-5D3KDTPX');
  assert.equal(googleDefaults.googleAnalyticsId, 'G-Q5S8DTCR9N');
  assert.equal(googleConfig(googleDefaults).publisherId, 'ca-pub-7808964787779354');
  assert.equal(googleConfig({ googleTagManagerId: '<script>alert(1)</script>', googleAdSenseId: 'pub-1' }).gtmId, '');
});


function environment({ path = '/', host = 'www.kozatv.com.tr', legacy = null } = {}) {
  const scripts = [], removedCookies = [], stored = new Map(legacy ? [['koza_cookie_consent_v1', legacy]] : []);
  const window = { location: { pathname: path, hostname: host }, dataLayer: [], localStorage: { getItem: k => stored.get(k), removeItem: k => stored.delete(k) } };
  const document = { createElement: () => ({}), getElementById: id => scripts.find(s => s.id === id), head: { appendChild: s => scripts.push(s) }, get cookie() { return '_ga=one; _ga_Q5S8DTCR9N=two; koza_admin_session=private'; }, set cookie(value) { removedCookies.push(value); } };
  return { window, document, scripts, removedCookies, stored };
}

test('Panel olmadan Analytics ölçümü açık ve reklam izinleri kapalı başlar; scriptler bir kez yüklenir', async () => {
  const { startGoogleServices } = await import('../app/google-consent.mjs');
  const { googleConfig, googleDefaults } = await import('../db/google-model.mjs');
  const env = environment({ legacy: '{eski-panel}' }), config = googleConfig(googleDefaults);
  startGoogleServices({ ...env, config });
  startGoogleServices({ ...env, config });
  assert.equal(env.scripts.length, 2);
  assert.equal(env.window.dataLayer[0][0], 'consent');
  assert.equal(env.window.dataLayer[0][1], 'default');
  assert.deepEqual(env.window.dataLayer[0][2], { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  assert.equal(env.window.dataLayer.filter(v => v[0] === 'consent').length, 1);
  assert.ok(env.window.dataLayer.some(v => v[1] === 'allow_google_signals' && v[2] === false));
  assert.ok(env.window.dataLayer.some(v => v[1] === 'allow_ad_personalization_signals' && v[2] === false));
  assert.equal(env.stored.size, 0);
  assert.ok(env.removedCookies.some(v => v.startsWith('_ga=')));
  assert.ok(env.removedCookies.every(v => !v.startsWith('koza_admin_session')));
  for (const path of ['/admin', '/admin/giris', '/api/content', '/media/example.webp', '/_next/static/test.js']) {
    const excluded = environment({ path });
    startGoogleServices({ ...excluded, config });
    assert.equal(excluded.scripts.length, 0);
    assert.equal(excluded.window.dataLayer.length, 0);
  }
  const local = environment({ host: '127.0.0.1' });
  startGoogleServices({ ...local, config });
  assert.equal(local.scripts.length, 0);
});

test('AdSense kişiselleştirme istemez; kapalı veya boş kimlik yükleme yapmaz ve reklam izni verilmez', async () => {
  const { startGoogleServices } = await import('../app/google-consent.mjs');
  const { googleConfig, googleDefaults } = await import('../db/google-model.mjs');
  const env = environment();
  startGoogleServices({ ...env, config: googleConfig({ ...googleDefaults, googleAdSenseEnabled: '0' }) });
  assert.equal(env.scripts.length, 1);
  assert.match(env.scripts[0].src, /gtm.js\?id=GTM-5D3KDTPX$/);
  startGoogleServices({ ...env, config: googleConfig(googleDefaults) });
  assert.equal(env.scripts.length, 2);
  assert.equal(env.scripts[1].src, 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7808964787779354');
  assert.equal(env.scripts[1].crossOrigin, 'anonymous');
  assert.equal(env.window.adsbygoogle.requestNonPersonalizedAds, 1);
  assert.ok(env.window.dataLayer.every(v => !v[2] || (v[2].ad_storage !== 'granted' && v[2].ad_user_data !== 'granted' && v[2].ad_personalization !== 'granted')));
  const empty = environment();
  startGoogleServices({ ...empty, config: googleConfig({}) });
  assert.equal(empty.scripts.length, 0);
  const blocked = environment();
  blocked.window.localStorage = { getItem() { throw Error('blocked'); } };
  assert.doesNotThrow(() => startGoogleServices({ ...blocked, config: googleConfig(googleDefaults) }));
  assert.equal(blocked.scripts.length, 2);
});

test('Analytics yapılandırması GTM başlamadan önce uygulanır ve görsel bir öğe oluşturmaz', async () => {
  const { startGoogleServices } = await import('../app/google-consent.mjs');
  const { googleConfig, googleDefaults } = await import('../db/google-model.mjs');
  for (const path of ['/', '/haber/ornek', '/kategori/gundem', '/canli']) {
    const env = environment({ path });
    const createdElements = [];
    env.document.createElement = tag => { createdElements.push(tag); return {}; };
    const consentAtLoad = [];
    env.document.head.appendChild = script => {
      consentAtLoad.push(Array.from(env.window.dataLayer[0]));
      env.scripts.push(script);
    };
    startGoogleServices({ ...env, config: googleConfig(googleDefaults) });
    assert.ok(consentAtLoad.length > 0);
    assert.ok(consentAtLoad.every(command => command[0] === 'consent' && command[1] === 'default' && command[2].analytics_storage === 'granted'));
    assert.deepEqual(createdElements, ['script', 'script']);
    assert.ok(env.window.dataLayer.findIndex(message => message.event === 'gtm.js') > 0);
  }
});
