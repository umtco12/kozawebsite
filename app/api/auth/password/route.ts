import { changeAdminPassword } from "../../../../db";
import { clearSessionCookie, getRequestAdmin } from "../../write-access";

export async function POST(request: Request) {
  const user = getRequestAdmin(request);
  if (!user) return Response.json({ error: "Yönetim oturumu gerekli." }, { status: 401 });
  try {
    const payload = await request.json() as { currentPassword?: string; nextPassword?: string };
    changeAdminPassword(user.id, String(payload.currentPassword ?? ""), String(payload.nextPassword ?? ""));
    return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(request) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Parola değiştirilemedi." }, { status: 400 });
  }
}
