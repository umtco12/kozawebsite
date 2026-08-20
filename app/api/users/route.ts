import { createAdminUser, listAdminUsers, type AdminRole } from "../../../db";
import { authorizeAdmin } from "../write-access";

const roles: AdminRole[] = ["admin", "publisher", "editor", "reporter", "viewer"];

export async function GET(request: Request) {
  const auth = authorizeAdmin(request, ["admin"]);
  if (auth.response) return auth.response;
  return Response.json({ users: listAdminUsers() });
}

export async function POST(request: Request) {
  const auth = authorizeAdmin(request, ["admin"]);
  if (auth.response) return auth.response;
  try {
    const payload = await request.json() as { email?: string; fullName?: string; password?: string; role?: AdminRole };
    const email = String(payload.email ?? "").trim().toLowerCase();
    const fullName = String(payload.fullName ?? "").trim();
    if (!/^\S+@\S+\.\S+$/.test(email) || fullName.length < 3 || !payload.role || !roles.includes(payload.role)) return Response.json({ error: "Ad, geçerli e-posta ve rol zorunludur." }, { status: 400 });
    const user = createAdminUser({ email, fullName, password: String(payload.password ?? ""), role: payload.role }, auth.user!.fullName);
    return Response.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Kullanıcı oluşturulamadı.";
    return Response.json({ error: message.includes("UNIQUE") ? "Bu e-posta ile bir kullanıcı zaten var." : message }, { status: message.includes("UNIQUE") ? 409 : 400 });
  }
}
