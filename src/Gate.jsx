import { useState } from 'react';
import { RABBIS, SHIURIM, completeProfile, validIsraeliId, resendVerification, checkVerified, logout } from './store.js';

export function VerifyEmail({ email }) {
  const [msg, setMsg] = useState('');
  const run = async (fn, ok) => {
    try { await fn(); setMsg(ok); } catch { setMsg('אירעה שגיאה, נסה שוב בעוד דקה'); }
  };
  return (
    <div className="auth">
      <h1>אימות מייל</h1>
      <p>שלחנו קישור אימות אל <b dir="ltr">{email}</b>. לחץ עליו ואז חזור לכאן.</p>
      <button className="primary" onClick={() => run(checkVerified, 'המייל עדיין לא אומת')}>אימתתי – המשך</button>
      <button onClick={() => run(resendVerification, 'נשלח מייל חדש (בדוק גם בספאם)')}>שלח שוב</button>
      <button onClick={logout}>יציאה</button>
      {msg && <p className="hint">{msg}</p>}
    </div>
  );
}

export function CompleteProfile({ authUser }) {
  const [f, setF] = useState({ name: authUser.name || '', phone: '', shiur: SHIURIM[0], rabbiId: '', idNumber: '' });
  const [err, setErr] = useState('');
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async () => {
    if (f.name.trim().split(/\s+/).length < 2) return setErr('נא למלא שם מלא');
    if (!/^05\d{8}$/.test(f.phone)) return setErr('מספר טלפון לא תקין (05XXXXXXXX)');
    if (!f.rabbiId) return setErr('נא לבחור רב');
    if (!validIsraeliId(f.idNumber)) return setErr('תעודת זהות לא תקינה');
    try { await completeProfile({ ...f, name: f.name.trim() }); } catch { setErr('אירעה שגיאה, נסה שוב'); }
  };

  return (
    <div className="auth">
      <h1>השלמת פרטים</h1>
      <p className="hint" dir="ltr">{authUser.email}</p>
      <input placeholder="שם מלא" value={f.name} onChange={up('name')} />
      <input placeholder="טלפון (05XXXXXXXX)" inputMode="tel" value={f.phone} onChange={up('phone')} />
      <select value={f.shiur} onChange={(e) => setF({ ...f, shiur: e.target.value, rabbiId: '' })}>
        {SHIURIM.map((s) => <option key={s}>{s}</option>)}
      </select>
      <select value={f.rabbiId} onChange={up('rabbiId')}>
        <option value="">בחר רב מלמד…</option>
        {RABBIS.filter((r) => r.shiur === f.shiur).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <input placeholder="תעודת זהות" inputMode="numeric" value={f.idNumber} onChange={up('idNumber')} />
      <button className="primary" onClick={submit}>שלח לאישור</button>
      <button onClick={logout}>יציאה</button>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
