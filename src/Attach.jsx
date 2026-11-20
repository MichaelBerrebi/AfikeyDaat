import { useState } from 'react';
import { attachFile, loadFile, useStore, set } from './store.js';

// בחירת קובץ (תמונה/PDF) – מחזיר { fileId, fileName, fileType } דרך onDone
export function AttachPicker({ user, onDone, label = 'צרף תמונה / PDF' }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setErr(''); setBusy(true);
    try { onDone(await attachFile(file, user)); }
    catch (x) { setErr(x?.message === 'too-big' ? 'ה-PDF גדול מדי (עד 600KB). אפשר לדחוס או לצלם כתמונה.' : 'הטעינה נכשלה'); }
    setBusy(false);
  };
  return (
    <label className="hint">
      {label}: <input type="file" accept="image/*,application/pdf" disabled={busy} onChange={pick} />
      {busy && ' מעלה…'}
      {err && <span className="err"> {err}</span>}
    </label>
  );
}

export function Attachment({ att }) {
  const [file, setFile] = useState(null);
  const [err, setErr] = useState(false);
  if (!att?.fileId) return null;
  const open = async () => {
    try { const f = await loadFile(att.fileId); f ? setFile(f) : setErr(true); } catch { setErr(true); }
  };
  if (!file)
    return <button onClick={open}>{att.fileType === 'pdf' ? '📄' : '🖼️'} הצג {att.fileName || 'קובץ'}{err ? ' (לא נמצא)' : ''}</button>;
  return file.type === 'pdf'
    ? <a className="primary-link" href={file.data} download={file.name} target="_blank" rel="noreferrer">📄 פתח / הורד {file.name}</a>
    : <img src={file.data} alt={file.name} style={{ width: '100%', borderRadius: 8 }} />;
}

// מסמך מצורף כללי (סדר יום, קטלוג ספרים…) שמנוהל תחת המפתח name באוסף docs
export function DocSlot({ name, user, manager, label }) {
  const docs = useStore('docs') || {};
  const att = docs[name];
  return (
    <div className="card">
      <b>{label}</b>
      {att ? <Attachment key={att.fileId} att={att} /> : !manager && <small>עדיין לא הועלה.</small>}
      {manager && (
        <>
          <AttachPicker user={user} label={att ? 'החלפה' : 'העלאה'} onDone={(a) => set('docs', { ...docs, [name]: a })} />
          {att && <button onClick={() => { const d = { ...docs }; delete d[name]; set('docs', d); }}>הסר</button>}
        </>
      )}
    </div>
  );
}
