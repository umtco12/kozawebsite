"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
    const data = await response.json(); setBusy(false);
    if (!response.ok) { setMessage(data.error ?? "Giriş yapılamadı."); return; }
    window.location.assign(data.user?.mustChangePassword ? "/admin/parola" : "/admin");
  }

  return <main className="auth-shell"><section className="auth-brand"><Link href="/"><img src="/koza-logo.png" alt="Koza TV" /></Link><div><span>KOZA TV YAYIN SİSTEMİ</span><h1>Haber masasının güvenli giriş noktası.</h1><p>Haberler, kategoriler, görseller ve yayın akışı yalnızca yetkili ekip üyeleri tarafından yönetilir.</p></div><ul><li><b>01</b> Rol bazlı işlem yetkileri</li><li><b>02</b> Güvenli ve süreli oturum</li><li><b>03</b> Editör onaylı yayın akışı</li></ul></section><section className="auth-panel"><form onSubmit={submit}><span className="auth-kicker">YÖNETİM PANELİ</span><h2>Tekrar hoş geldiniz</h2><p>Koza TV hesabınızla güvenli oturum açın.</p><label>E-posta adresi<input autoComplete="username" type="email" name="email" required placeholder="ad@kozatv.com.tr" /></label><label>Parola<input autoComplete="current-password" type="password" name="password" required placeholder="••••••••••••" /></label>{message && <div className="auth-error" role="alert">{message}</div>}<button disabled={busy} type="submit">{busy ? "Kontrol ediliyor…" : "Güvenli giriş yap"}</button><small>5 hatalı denemede hesap 15 dakika kilitlenir.</small></form><Link className="auth-back" href="/">← Haber sitesine dön</Link></section></main>;
}
