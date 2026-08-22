import { getSiteSettings, saveSiteSettings } from "../../../db";
import { settingFields, settingGroups, validateSettings } from "../../../db/settings-model.mjs";
import { authorizeAdmin } from "../write-access";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher", "editor", "reporter", "viewer"]);
  if (auth.response) return auth.response;
  return Response.json({ settings: getSiteSettings(), fields: settingFields, groups: settingGroups });
}

export async function PATCH(request: Request) {
  const auth = authorizeAdmin(request, ["admin", "publisher"]);
  if (auth.response) return auth.response;
  try {
    const payload = await request.json() as Record<string, unknown>;
    const { values, errors, valid } = validateSettings(payload);
    if (!valid) return Response.json({ error: "Bazı alanlar düzeltilmelidir.", fields: errors }, { status: 400 });
    if (!Object.keys(values).length) return Response.json({ error: "Değiştirilecek alan gönderilmedi." }, { status: 400 });
    return Response.json({ ok: true, settings: saveSiteSettings(values as unknown as Record<string, string>, auth.user!.fullName) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Ayarlar kaydedilemedi." }, { status: 400 });
  }
}
