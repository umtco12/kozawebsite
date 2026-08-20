import { deleteAdminSession } from "../../../../db";
import { clearSessionCookie, getSessionToken } from "../../write-access";

export async function POST(request: Request) {
  deleteAdminSession(getSessionToken(request));
  return Response.json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(request) } });
}
