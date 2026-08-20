import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSession } from "../../../db";
import { ADMIN_SESSION_COOKIE } from "../../api/write-access";
import { PasswordForm } from "./form";

export const dynamic = "force-dynamic";

export default async function PasswordPage() {
  const cookieStore = await cookies();
  const session = getAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value ?? "");
  if (!session) redirect("/admin/giris");
  return <PasswordForm fullName={session.user.fullName} />;
}
