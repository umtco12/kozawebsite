import { getAdminSession, type AdminRole, type AdminUser } from "../../db";

export const ADMIN_SESSION_COOKIE = "koza_admin_session";

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
  return "";
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0].trim();
    const expectedHost = forwardedHost || request.headers.get("host") || new URL(request.url).host;
    return new URL(origin).host.toLowerCase() === expectedHost.toLowerCase();
  } catch {
    return false;
  }
}

export function getRequestAdmin(request: Request): AdminUser | null {
  return getAdminSession(readCookie(request, ADMIN_SESSION_COOKIE))?.user ?? null;
}

export function authorizeAdmin(request: Request, roles: readonly AdminRole[]) {
  if (!sameOrigin(request)) return { response: Response.json({ error: "Geçersiz istek kaynağı." }, { status: 403 }), user: null };
  const user = getRequestAdmin(request);
  if (!user) return { response: Response.json({ error: "Yönetim oturumu gerekli." }, { status: 401 }), user: null };
  if (user.mustChangePassword) return { response: Response.json({ error: "Devam etmeden önce geçici parolanızı değiştirin.", code: "PASSWORD_CHANGE_REQUIRED" }, { status: 403 }), user };
  if (!roles.includes(user.role)) return { response: Response.json({ error: "Bu işlem için yetkiniz bulunmuyor." }, { status: 403 }), user };
  return { response: null, user };
}

export function sessionCookie(token: string, request: Request, maxAge = 12 * 60 * 60) {
  const secure = request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https" || new URL(request.url).protocol === "https:";
  return `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? "; Secure" : ""}`;
}

export function clearSessionCookie(request: Request) { return sessionCookie("", request, 0); }
export function getSessionToken(request: Request) { return readCookie(request, ADMIN_SESSION_COOKIE); }
