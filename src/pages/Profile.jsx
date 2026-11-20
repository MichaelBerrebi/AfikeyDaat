import { useState } from 'react';
import { updateUser, useClasses, validPhone, validEmail, normPhone, isProfileComplete, isRealEmail, ROLE_LABELS, STUDENT_STATUS } from '../store.js';

export default function Profile({ user, forced }) {
  const { shiurim, rabbis } = useClasses();
  const [f, setF] = useState({ name: user.name || '', phone: user.phone || '', email: isRealEmail(user.email) ? user.email : '', studentStatus: user.studentStatus || '' });
  const [msg, setMsg] = useState('');
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const isRabbi = user.role === 'rabbi' || user.requestedType === 'rabbi';
  const shiur = shiurim.find((s) => s.id === user.shiurId)?.name;
  const rabbi = rabbis.find((r) => r.id === user.rabbiId)?.name;

  const save = async () => {
    const draft = { ...user, ...f, phone: normPhone(f.phone) };
    if (f.name.trim().split(/\s+/).length < 2) return setMsg('נא למלא שם מלא');
    if (!validPhone(f.phone)) return setMsg('מספר טלפון לא תקין');
    if (!validEmail(f.email)) return setMsg('נא למלא כתובת מייל תקינה');
    if (!isRabbi && !f.studentStatus) return setMsg('נא לבחור סטטוס');
    if (!shiur) return setMsg('לא שויכת לשיעור – פנה להנהלה');
    try {
      await updateUser(user.id, { name: f.name.trim(), phone: draft.phone, email: f.email.trim().toLowerCase(), studentStatus: isRabbi ? '' : f.studentStatus });
      setMsg('נשמר ✔');
    } catch { setMsg('השמירה נכשלה'); }
  };

  return (
    <>
      {forced && <p className="err">יש להשלים את הפרופיל האישי כדי להמשיך.</p>}
      <div className="card">
        <small>{ROLE_LABELS[user.role]}{!isProfileComplete(user) && ' · פרופיל חסר'}</small>
        <input placeholder="שם מלא" value={f.name} onChange={up('name')} />
        <input placeholder="טלפון" inputMode="tel" value={f.phone} onChange={up('phone')} />
        <input placeholder="מייל" type="email" dir="ltr" value={f.email} onChange={up('email')} />
        {!isRabbi && (
          <select value={f.studentStatus} onChange={up('studentStatus')}>
            <option value="">סטטוס…</option>
            {Object.entries(STUDENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}
        <p className="hint">שיעור: {shiur || '—'} · רב: {rabbi || '—'} (שינוי כיתה – דרך הנהלת הישיבה)</p>
        <button className="primary" onClick={save}>שמור</button>
        {msg && <p className="hint">{msg}</p>}
      </div>
    </>
  );
}
