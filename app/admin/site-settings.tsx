"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Field = { key: string; group: string; type: string; label: string; hint?: string; placeholder?: string; minLength?: number; maxLength?: number; required?: boolean };
type Group = { id: string; label: string; description: string };
type ScheduleRow = { time: string; title: string; host: string };

const emptyRow: ScheduleRow = { time: "", title: "", host: "" };

/* Site Ayarları: canlı yayın kaynağı, sosyal hesaplar, künye/iletişim bilgileri ve yayın akışı
   yöneticiler tarafından buradan güncellenir. Ziyaretçi sitesi doğrudan bu değerleri okur. */
export function SiteSettingsPanel({ canEdit }: { canEdit: boolean }) {
  const [fields, setFields] = useState<Field[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [schedule, setSchedule] = useState<ScheduleRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/settings");
    if (!response.ok) { setMessage("Ayarlar okunamadı."); return; }
    const data = await response.json();
    setFields(data.fields ?? []); setGroups(data.groups ?? []); setValues(data.settings ?? {});
    try { setSchedule(JSON.parse(data.settings?.broadcastSchedule ?? "[]")); } catch { setSchedule([]); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  function update(key: string, value: string) { setValues((current) => ({ ...current, [key]: value })); }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true); setErrors({}); setMessage("Ayarlar kaydediliyor…");
    const payload: Record<string, unknown> = {};
    for (const field of fields) payload[field.key] = field.type === "bool" ? values[field.key] === "1" : values[field.key] ?? "";
    payload.broadcastSchedule = schedule;
    const response = await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json(); setSaving(false);
    if (!response.ok) { setErrors(data.fields ?? {}); setMessage(data.error ?? "Ayarlar kaydedilemedi."); return; }
    setValues(data.settings); setMessage("Ayarlar kaydedildi ve sitede yayına alındı.");
  }

  return (
    <div className="settings-layout">
      <form className="settings-form" onSubmit={submit}>
        {groups.map((group) => (
          <section className="editor-section" key={group.id}>
            <div className="editor-section-head"><span>{group.id === "yayin" ? "01" : group.id === "sosyal" ? "02" : "03"}</span><div><h2>{group.label}</h2><p>{group.description}</p></div></div>
            <div className="form-grid">
              {fields.filter((field) => field.group === group.id).map((field) => (
                field.type === "bool" ? (
                  <label className="settings-toggle wide" key={field.key}>
                    <input type="checkbox" checked={values[field.key] === "1"} disabled={!canEdit} onChange={(event) => update(field.key, event.target.checked ? "1" : "0")} />
                    <span><strong>{field.label}</strong>{field.hint && <small>{field.hint}</small>}</span>
                  </label>
                ) : field.type === "textarea" ? (
                  <label className="wide" key={field.key}>{field.label}
                    <textarea rows={2} value={values[field.key] ?? ""} minLength={field.minLength} maxLength={field.maxLength} required={field.required} disabled={!canEdit} placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value)} />
                    {field.hint && <small>{field.hint}</small>}{errors[field.key] && <em>{errors[field.key]}</em>}
                  </label>
                ) : (
                  <label className={field.type === "url" ? "wide" : ""} key={field.key}>{field.label}
                    <input type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"} value={values[field.key] ?? ""} minLength={field.minLength} maxLength={field.maxLength} required={field.required} disabled={!canEdit} placeholder={field.placeholder} onChange={(event) => update(field.key, event.target.value)} />
                    {field.hint && <small>{field.hint}</small>}{errors[field.key] && <em>{errors[field.key]}</em>}
                  </label>
                )
              ))}
            </div>
          </section>
        ))}

        <section className="editor-section">
          <div className="editor-section-head"><span>04</span><div><h2>Yayın akışı</h2><p>Canlı yayın sayfasındaki günün program akışı.</p></div></div>
          <div className="schedule-editor">
            {schedule.map((row, index) => (
              <div className="schedule-row" key={index}>
                <input aria-label={`${index + 1}. satır saati`} value={row.time} placeholder="19:00" disabled={!canEdit} onChange={(event) => setSchedule(schedule.map((item, position) => position === index ? { ...item, time: event.target.value } : item))} />
                <input aria-label={`${index + 1}. satır programı`} value={row.title} placeholder="Ana Haber Bülteni" disabled={!canEdit} onChange={(event) => setSchedule(schedule.map((item, position) => position === index ? { ...item, title: event.target.value } : item))} />
                <input aria-label={`${index + 1}. satır sunucusu`} value={row.host} placeholder="Haber Merkezi" disabled={!canEdit} onChange={(event) => setSchedule(schedule.map((item, position) => position === index ? { ...item, host: event.target.value } : item))} />
                {canEdit && <button type="button" aria-label={`${index + 1}. satırı kaldır`} onClick={() => setSchedule(schedule.filter((_, position) => position !== index))}>×</button>}
              </div>
            ))}
            {errors.broadcastSchedule && <em>{errors.broadcastSchedule}</em>}
            {canEdit && <button type="button" className="schedule-add" onClick={() => setSchedule([...schedule, { ...emptyRow }])}>+ Yayın satırı ekle</button>}
          </div>
        </section>

        {message && <div className={message.includes("edilemedi") || message.includes("okunamadı") ? "newsroom-message error" : "newsroom-message"}>{message}</div>}
        {canEdit && <button className="settings-save" type="submit" disabled={saving}>{saving ? "Kaydediliyor…" : "Ayarları kaydet"}</button>}
        {!canEdit && <p className="settings-readonly">Bu ekranı yalnızca yönetici ve yayın yönetmeni değiştirebilir.</p>}
      </form>

      <aside className="settings-aside">
        <strong>Bu ayarlar nereye yansır?</strong>
        <ul>
          <li><b>Site mottosu</b> → tüm ziyaretçi sayfalarının üst bölümünde, Koza TV logosunun yanında gösterilir.</li>
          <li><b>Canlı yayın adresi</b> → <code>/canli</code> oynatıcısı. Boşsa kesinti ekranı gösterilir.</li>
          <li><b>Yedek yayın adresi</b> → ana kaynak açılmazsa devreye girer.</li>
          <li><b>Sosyal hesaplar</b> → üst bant ve alt bölüm simgeleri. Boş hesap bağlantı olarak gösterilmez.</li>
          <li><b>Künye alanları</b> → <code>/kurumsal/kunye</code> ve <code>/kurumsal/iletisim</code>.</li>
          <li><b>Piyasa göstergesi</b> → BIST 100, gram altın, Dolar ve Euro değişimleri otomatik okunur; ana akış kesilirse TCMB döviz verisi güvenli yedektir.</li>
          <li><b>Yayın akışı</b> → <code>/canli</code> sayfasındaki program listesi.</li>
        </ul>
      </aside>
    </div>
  );
}
