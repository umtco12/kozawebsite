"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Field = { key: string; group: string; type: string; label: string; hint?: string; placeholder?: string; minLength?: number; maxLength?: number; required?: boolean };
type Group = { id: string; label: string; description: string };
type ScheduleRow = { time: string; end: string; title: string; host: string; image: string; days: string };
type MediaAsset = { id: number; publicUrl: string; originalName: string; altText: string };

const emptyRow: ScheduleRow = { time: "", end: "", title: "", host: "", image: "", days: "hafta-ici" };
const dayScopes = [
  { value: "hafta-ici", label: "Hafta içi" },
  { value: "hafta-sonu", label: "Hafta sonu" },
  { value: "her-gun", label: "Her gün" },
];

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
  const [library, setLibrary] = useState<MediaAsset[]>([]);
  const [pickerRow, setPickerRow] = useState<number | null>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/settings");
    if (!response.ok) { setMessage("Ayarlar okunamadı."); return; }
    const data = await response.json();
    setFields(data.fields ?? []); setGroups(data.groups ?? []); setValues(data.settings ?? {});
    try {
      const rows = JSON.parse(data.settings?.broadcastSchedule ?? "[]");
      setSchedule(Array.isArray(rows) ? rows.map((row: Partial<ScheduleRow>) => ({ ...emptyRow, ...row, days: row.days ?? "her-gun" })) : []);
    } catch { setSchedule([]); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  /* Sunucu fotoğrafı seçimi kalıcı medya kütüphanesinden yapılır; dışarıdan adres girilmez. */
  useEffect(() => {
    if (pickerRow === null || library.length) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/media?type=image&limit=60", { signal: controller.signal });
        if (!response.ok) return;
        const data = await response.json();
        setLibrary(Array.isArray(data.media) ? data.media : []);
      } catch { /* Panel açıkken iptal edilen istek sessizce geçilir. */ }
    })();
    return () => controller.abort();
  }, [pickerRow, library.length]);

  function update(key: string, value: string) { setValues((current) => ({ ...current, [key]: value })); }

  function updateRow(index: number, patch: Partial<ScheduleRow>) {
    setSchedule((current) => current.map((row, position) => (position === index ? { ...row, ...patch } : row)));
  }

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
          <div className="editor-section-head"><span>04</span><div><h2>Yayın akışı</h2><p>Site başlığındaki şerit ve canlı yayın sayfası bu akışı kullanır. Saatler Türkiye saatidir. Bitiş boş bırakılırsa program bir sonraki başlangıca kadar sürer; sunucu fotoğrafı medya kütüphanesinden seçilir.</p></div></div>
          <div className="schedule-editor">
            {schedule.map((row, index) => (
              <div className="schedule-row" key={index}>
                <div className="schedule-photo">
                  {row.image ? <img src={row.image} alt="" /> : <span aria-hidden="true">FOTO</span>}
                  {canEdit && <button type="button" onClick={() => setPickerRow(pickerRow === index ? null : index)} aria-expanded={pickerRow === index}>{row.image ? "Değiştir" : "Fotoğraf seç"}</button>}
                  {canEdit && row.image && <button type="button" className="quiet" onClick={() => updateRow(index, { image: "" })}>Kaldır</button>}
                </div>
                <div className="schedule-fields">
                  <label>Başlangıç<input aria-label={`${index + 1}. satır başlangıç saati`} value={row.time} placeholder="08:00" disabled={!canEdit} onChange={(event) => updateRow(index, { time: event.target.value })} /></label>
                  <label>Bitiş<input aria-label={`${index + 1}. satır bitiş saati`} value={row.end} placeholder="10:00" disabled={!canEdit} onChange={(event) => updateRow(index, { end: event.target.value })} /></label>
                  <label className="wide">Program<input aria-label={`${index + 1}. satır programı`} value={row.title} placeholder="Sabah Mesaisi" disabled={!canEdit} onChange={(event) => updateRow(index, { title: event.target.value })} /></label>
                  <label className="wide">Sunucu<input aria-label={`${index + 1}. satır sunucusu`} value={row.host} placeholder="Sinem Gündem" disabled={!canEdit} onChange={(event) => updateRow(index, { host: event.target.value })} /></label>
                  <label>Yayın günü
                    <select aria-label={`${index + 1}. satır yayın günü`} value={row.days} disabled={!canEdit} onChange={(event) => updateRow(index, { days: event.target.value })}>
                      {dayScopes.map((scope) => <option value={scope.value} key={scope.value}>{scope.label}</option>)}
                    </select>
                  </label>
                </div>
                {canEdit && <button type="button" className="schedule-remove" aria-label={`${index + 1}. satırı kaldır`} onClick={() => { setPickerRow(null); setSchedule(schedule.filter((_, position) => position !== index)); }}>×</button>}
                {pickerRow === index && (
                  <div className="schedule-picker" aria-label={`${index + 1}. satır için fotoğraf kütüphanesi`}>
                    {library.length ? library.map((item) => (
                      <button type="button" className={row.image === item.publicUrl ? "selected" : ""} key={item.id} onClick={() => { updateRow(index, { image: item.publicUrl }); setPickerRow(null); }}>
                        <img src={item.publicUrl} alt={item.altText} />
                        <span>{item.originalName}</span>
                      </button>
                    )) : <p>Medya kütüphanesinde fotoğraf bulunamadı. Sunucu fotoğraflarını önce <b>Medya Kütüphanesi</b> ekranından yükleyin.</p>}
                  </div>
                )}
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
          <li><b>Yayın akışı</b> → Site başlığındaki sunucu fotoğraflı şerit ve <code>/canli</code> sayfasındaki program listesi. Şeritte o an yayında olan program işaretlenir; hafta içi seçilen programlar hafta sonu gösterilmez.</li>
        </ul>
      </aside>
    </div>
  );
}
