import { AdminPanel } from "./panel";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../db";
import { ADMIN_SESSION_COOKIE } from "../api/write-access";

export const dynamic = "force-dynamic";

export default async function Admin() {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "");
  if (!session) redirect("/admin/giris");
  if (session.user.mustChangePassword) redirect("/admin/parola");
  return <AdminPanel currentUser={session.user} />;
}
