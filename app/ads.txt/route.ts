import { getSiteSettings } from '../../db';
import { googleConfig } from '../../db/google-model.mjs';
export const dynamic = 'force-dynamic';
export function GET() {
  const { publisherId } = googleConfig(getSiteSettings());
  return new Response(publisherId ? `google.com, ${publisherId.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n` : '', {
    status: publisherId ? 200 : 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
  });
}
