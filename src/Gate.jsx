import { useState } from 'react';
import RegFields, { emptyReg, validateReg } from './RegFields.jsx';
import { completeProfile, resendVerification, checkVerified, logout } from './store.js';

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
  const [f, setF] = useState({ ...emptyReg, name: authUser.name || '' });
  const [err, setErr] = useState('');

  const submit = async () => {
    const v = validateReg(f);
    if (v) return setErr(v);
    try { await completeProfile({ ...f, name: f.name.trim() }); } catch { setErr('אירעה שגיאה, נסה שוב'); }
  };

  return (
    <div className="auth">
      <h1>השלמת פרטים</h1>
      <p className="hint" dir="ltr">{authUser.email}</p>
      <RegFields f={f} setF={setF} hideEmail />
      <button className="primary" onClick={submit}>שלח לאישור</button>
      <button onClick={logout}>יציאה</button>
      {err && <p className="err">{err}</p>}
    </div>
  );
}
