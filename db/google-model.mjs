/* Herkese açık yayın/ölçüm kimlikleri; parola veya API anahtarı değildir. */
export const googleDefaults = {
  googleTagManagerId: 'GTM-5D3KDTPX',
  googleAnalyticsId: 'G-Q5S8DTCR9N',
  googleSearchConsoleToken: 'SZkV7s3VUP_26-a4os2Jn5i9bXNoDGnjmDI_i40iAJ8',
  googleAdSenseId: 'ca-pub-7808964787779354',
  googleAdSenseEnabled: '1',
};
export const googlePatterns = {
  googleTagManagerId: /^GTM-[A-Z0-9]{4,20}$/,
  googleAnalyticsId: /^G-[A-Z0-9]{4,20}$/,
  googleSearchConsoleToken: /^[A-Za-z0-9_-]{20,200}$/,
  googleAdSenseId: /^ca-pub-\d{16}$/,
};
export function googleConfig(settings) {
  const valid = key => googlePatterns[key].test(String(settings?.[key] ?? '')) ? settings[key] : '';
  return { gtmId: valid('googleTagManagerId'), analyticsId: valid('googleAnalyticsId'), verification: valid('googleSearchConsoleToken'), publisherId: valid('googleAdSenseId'), advertisingEnabled: settings?.googleAdSenseEnabled === '1' };
}
