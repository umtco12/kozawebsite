import { permanentRedirect, redirect } from "next/navigation";
import { findRedirect, recordRedirectHit } from "../db";

/* Yönetim panelinde tanımlı eski adres eşlemesi varsa ziyaretçiyi yeni adrese gönderir.
   Eşleme yoksa geri döner ve çağıran sayfa kendi 404 davranışını uygular. Var olan dinamik
   rotalar (haber, kategori, yazar) kendi 404'lerinden önce bu kontrolü çağırır; böylece eski
   `/haber/...` adresleri de taşınabilir. */
export function redirectIfMapped(path: string) {
  const match = findRedirect(path);
  if (!match) return;
  recordRedirectHit(match.id);
  if (match.kind === "temporary") redirect(match.toPath);
  permanentRedirect(match.toPath);
}
