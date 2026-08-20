"use client";

import { FormEvent, useState } from "react";

export function PasswordForm({ fullName }: { fullName: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); const form = new FormData(event.currentTarget);
    const nextPassword = String(form.get("nextPassword") ?? "");
    if (nextPassword !== form.get("confirmation")) { setMessage("Yeni parola ve tekrarı eşleşmiyor."); return; }
    setBusy(true); const response = await fetch("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), nextPassword }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Parola değiştirilemedi."); return; }
    window.location.assign("/admin/giris?parola=degisti");
  }
  return <main className="auth-shell password-shell"><section className="auth-brand"><img src="/koza-logo.png" alt="Koza TV" /><div><span>İLK GİRİŞ GÜVENLİĞİ</span><h1>Geçici parolanızı yenileyin.</h1><p>Merhaba {fullName}. Yönetim panelini kullanmadan önce yalnızca sizin bildiğiniz kalıcı bir parola belirleyin.</p></div><ul><li><b>12+</b> En az 12 karakter</li><li><b>Aa</b> Büyük ve küçük harf</li><li><b>1!</b> Rakam ve özel karakter</li></ul></section><section className="auth-panel"><form onSubmit={submit}><span className="auth-kicker">PAROLA GÜNCELLEME</span><h2>Hesabınızı koruyun</h2><label>Geçici parola<input autoComplete="current-password" type="password" name="currentPassword" required /></label><label>Yeni parola<input autoComplete="new-password" type="password" name="nextPassword" minLength={12} required /></label><label>Yeni parola tekrar<input autoComplete="new-password" type="password" name="confirmation" minLength={12} required /></label>{message && <div className="auth-error" role="alert">{message}</div>}<button disabled={busy}>{busy ? "Güncelleniyor…" : "Parolayı güncelle"}</button><small>İşlemden sonra yeni parolanızla tekrar giriş yapacaksınız.</small></form></section></main>;
}
