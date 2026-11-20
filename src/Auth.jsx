import { useState } from 'react';
import { register, login, resetPassword, googleSignIn, cloudEnabled, validIsraeliId } from './store.js';
import RegFields, { emptyReg, validateReg } from './RegFields.jsx';

const msg = (e) => {
  const c = e?.code || e?.message || '';
  if (c.includes('email-already-in-use') || c === 'exists') return 'המשתמש כבר רשום';
  if (c.includes('weak-password')) return 'סיסמה חלשה (לפחות 6 תווים)';
  if (c.includes('invalid-email')) return 'כתובת מייל לא תקינה';
  if (c.includes('credential') || c.includes('user-not-found') || c.includes('wrong-password') || c === 'bad-credentials')
    return 'הפרטים לא נמצאו או שהסיסמה שגויה. נא להירשם.';
  return 'אירעה שגיאה, נסה שוב';
};

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ ...emptyReg, password: '', identifier: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');
  const [forgot, setForgot] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const reset = async () => {
    setErr(''); setInfo('');
    if (!f.identifier.trim()) return setErr('נא למלא טלפון או מייל');
    if (!cloudEnabled && !validIsraeliId(f.idNumber)) return setErr('נא למלא תעודת זהות תקינה');
    if (!cloudEnabled && f.password.length < 6) return setErr('סיסמה חדשה: לפחות 6 תווים');
    setBusy(true);
    try {
      await resetPassword({ identifier: f.identifier, idNumber: f.idNumber, newPassword: f.password });
      setInfo(cloudEnabled ? 'נשלח קישור לאיפוס הסיסמה אל המייל (בדוק גם בספאם)' : 'הסיסמה עודכנה. אפשר להיכנס.');
      if (!cloudEnabled) setForgot(false);
    } catch (e) {
      setErr(e?.message === 'phone-only'
        ? 'לחשבון שנרשם עם טלפון בלבד אי אפשר לשלוח קישור. פנה להנהלת הישיבה לאיפוס.'
        : e?.message === 'bad-credentials' ? 'הפרטים לא תואמים לאף משתמש' : 'אירעה שגיאה, נסה שוב');
    }
    setBusy(false);
  };

  const google = async () => {
    setErr('');
    try { await googleSignIn(); } catch { setErr('ההתחברות עם גוגל נכשלה'); }
  };

  const submit = async () => {
    setErr('');
    if (mode === 'login') {
      if (!f.identifier.trim() || !f.password) return setErr('נא למלא טלפון/מייל וסיסמה');
    } else {
      const v = validateReg(f);
      if (v) return setErr(v);
      if (f.password.length < 6) return setErr('סיסמה: לפחות 6 תווים');
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(f.identifier, f.password);
      else await register({ ...f, name: f.name.trim(), email: f.email.trim().toLowerCase() });
    } catch (e) {
      setErr(msg(e));
    }
    setBusy(false);
  };

  if (forgot)
    return (
      <div className="auth">
        <h1>שכחתי פרטי כניסה</h1>
        <p className="hint">
          שם המשתמש הוא הטלפון או המייל שבהם נרשמת.
          {cloudEnabled ? ' הזן את המייל ונשלח קישור לאיפוס סיסמה.' : ' כדי לאפס סיסמה הזן טלפון/מייל, תעודת זהות וסיסמה חדשה.'}
        </p>
        <input placeholder="טלפון או מייל" value={f.identifier} onChange={up('identifier')} />
        {!cloudEnabled && (
          <>
            <input placeholder="תעודת זהות" inputMode="numeric" value={f.idNumber} onChange={up('idNumber')} />
            <input placeholder="סיסמה חדשה" type="password" value={f.password} onChange={up('password')} />
          </>
        )}
        <button className="primary" disabled={busy} onClick={reset}>{cloudEnabled ? 'שלח קישור איפוס' : 'אפס סיסמה'}</button>
        <button onClick={() => { setForgot(false); setErr(''); setInfo(''); }}>חזרה</button>
        {err && <p className="err">{err}</p>}
        {info && <p className="hint">{info}</p>}
        <p className="hint">שכחת גם את הטלפון/המייל? פנה להנהלת הישיבה – היא רואה את הפרטים שנרשמו.</p>
      </div>
    );

  return (
    <div className="auth">
      <h1>אפיקי דעת</h1>
      <div className="tabs">
        <button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>כניסה</button>
        <button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>הרשמה</button>
      </div>
      {mode === 'login' ? (
        <input placeholder="טלפון או מייל" value={f.identifier} onChange={up('identifier')} />
      ) : (
        <>
          <RegFields f={f} setF={setF} />
        </>
      )}
      <input placeholder="סיסמה" type="password" value={f.password} onChange={up('password')} />
      <button className="primary" disabled={busy} onClick={submit}>{mode === 'login' ? 'כניסה' : 'הרשמה'}</button>
      {mode === 'login' && <button onClick={() => { setForgot(true); setErr(''); }}>🔑 שכחתי שם משתמש / סיסמה</button>}
      {info && <p className="hint">{info}</p>}
      {cloudEnabled && <button onClick={google}>התחברות עם חשבון גוגל</button>}
      {err && <p className="err">{err}</p>}
      <p className="hint">ההרשמה מאושרת ידנית על ידי הנהלת הישיבה. הרשמה במייל דורשת אימות בקישור שיישלח אליו.</p>
    </div>
  );
}
