import { authenticateAdmin, createAdminSession } from "../../../../db";
import { sessionCookie } from "../../write-access";

export async function POST(request: Request) {
  let payload: { email?: string; password?: string };
  try { payload = await request.json(); } catch { return Response.json({ error: "Geçersiz giriş isteği." }, { status: 400 }); }
  const user = authenticateAdmin(String(payload.email ?? ""), String(payload.password ?? ""));
  if (!user) return Response.json({ error: "E-posta veya parola hatalı. Beş başarısız denemede hesap 15 dakika kilitlenir." }, { status: 401 });
  const session = createAdminSession(user.id, request.headers.get("user-agent") ?? "");
  return Response.json({ ok: true, user }, { headers: { "set-cookie": sessionCookie(session.token, request) } });
}
