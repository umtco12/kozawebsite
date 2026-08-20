import { getRequestAdmin } from "../../write-access";

export async function GET(request: Request) {
  const user = getRequestAdmin(request);
  return user ? Response.json({ user }) : Response.json({ error: "Yönetim oturumu gerekli." }, { status: 401 });
}
