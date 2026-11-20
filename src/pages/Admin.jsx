import { useState } from 'react';
import { useStore, set, uid, updateUser, removeUser, adminResetPassword, useClasses, isManager, canManage, ROLE_LABELS, STUDENT_STATUS, cloudEnabled } from '../store.js';

const ROLES = ['student', 'rabbi', 'rosh', 'admin'];

function ClassesEditor() {
  const { shiurim, rabbis, contacts } = useClasses();
  const [sName, setSName] = useState('');
  const [r, setR] = useState({ name: '', shiurId: '', phone: '' });
  const save = (next) => set('classes', { shiurim, rabbis, ...next });
  const saveContacts = (id, phone) => set('contacts', { ...contacts, [id]: phone });

  const addShiur = () => {
    if (!sName.trim()) return;
    save({ shiurim: [...shiurim, { id: uid(), name: sName.trim() }] });
    setSName('');
  };
  const delShiur = (id) => {
    if (rabbis.some((x) => x.shiurId === id)) return alert('יש רבנים בשיעור – יש להעביר או למחוק אותם קודם');
    save({ shiurim: shiurim.filter((s) => s.id !== id) });
  };
  const renameShiur = (s) => {
    const name = prompt('שם חדש לשיעור', s.name);
    if (name?.trim()) save({ shiurim: shiurim.map((x) => (x.id === s.id ? { ...x, name: name.trim() } : x)) });
  };
  const addRabbi = () => {
    if (!r.name.trim() || !r.shiurId) return;
    const id = uid();
    save({ rabbis: [...rabbis, { id, name: r.name.trim(), shiurId: r.shiurId }] });
    if (r.phone.trim()) saveContacts(id, r.phone.trim());
    setR({ name: '', shiurId: r.shiurId, phone: '' });
  };
  const editRabbi = (x) => {
    const name = prompt('שם הרב', x.name);
    if (name === null) return;
    const phone = prompt('טלפון התקשרות', contacts[x.id] || '');
    save({ rabbis: rabbis.map((y) => (y.id === x.id ? { ...y, name: name.trim() || y.name } : y)) });
    if (phone !== null) saveContacts(x.id, phone.trim());
  };
  const delRabbi = (id) => {
    if (confirm('למחוק את הרב?')) save({ rabbis: rabbis.filter((x) => x.id !== id) });
  };

  return (
    <details className="card">
      <summary><b>שיעורים ורבנים</b></summary>
      {shiurim.map((s) => (
        <div key={s.id}>
          <div className="row">
            <b>{s.name}</b>
            <span className="row-btns">
              <button onClick={() => renameShiur(s)}>שנה שם</button>
              <button onClick={() => delShiur(s.id)}>מחק</button>
            </span>
          </div>
          {rabbis.filter((x) => x.shiurId === s.id).map((x) => (
            <div className="row" key={x.id}>
              <small>{x.name} {contacts[x.id] ? `· ${contacts[x.id]}` : ''}</small>
              <span className="row-btns">
                <button onClick={() => editRabbi(x)}>ערוך</button>
                <button onClick={() => delRabbi(x.id)}>מחק</button>
              </span>
            </div>
          ))}
        </div>
      ))}
      <input placeholder="שיעור חדש (למשל שיעור ה׳)" value={sName} onChange={(e) => setSName(e.target.value)} />
      <button onClick={addShiur}>הוסף שיעור</button>
      <b>רב חדש</b>
      <input placeholder="שם הרב" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} />
      <select value={r.shiurId} onChange={(e) => setR({ ...r, shiurId: e.target.value })}>
        <option value="">שיעור…</option>
        {shiurim.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <input placeholder="טלפון התקשרות" inputMode="tel" value={r.phone} onChange={(e) => setR({ ...r, phone: e.target.value })} />
      <button onClick={addRabbi}>הוסף רב</button>
    </details>
  );
}

export default function Admin({ user }) {
  const users = useStore('users');
  const { shiurim, rabbis } = useClasses();
  const [q, setQ] = useState('');
  const shiurName = (id) => shiurim.find((s) => s.id === id)?.name || '—';
  const assignShiur = (u, shiurId) => updateUser(u.id, { shiurId, rabbiId: '' });
  const resetPw = async (u) => {
    try {
      if (cloudEnabled) {
        await adminResetPassword(u);
        alert('נשלח מייל איפוס סיסמה אל ' + u.email);
      } else {
        const pw = prompt('סיסמה זמנית חדשה (לפחות 6 תווים) עבור ' + u.name);
        if (!pw || pw.trim().length < 6) return;
        await adminResetPassword(u, pw);
        alert('הסיסמה עודכנה. מסור למשתמש את הסיסמה החדשה.');
      }
    } catch (e) {
      alert(e?.message === 'phone-only' ? 'למשתמש אין מייל – אי אפשר לשלוח איפוס. בקש ממנו להירשם מחדש עם מייל.' : 'הפעולה נכשלה');
    }
  };
  const approve = (u) => updateUser(u.id, { status: 'approved', ...(u.requestedType === 'rabbi' && u.role === 'student' ? { role: 'rabbi' } : {}) });
  const list = users.filter((u) => !q || `${u.name} ${u.phone} ${u.email}`.includes(q));

  return (
    <>
      <ClassesEditor />
      <p className="hint">אישור משתמשים וניהול הרשאות</p>
      <input placeholder="חיפוש לפי שם/טלפון/מייל" value={q} onChange={(e) => setQ(e.target.value)} />
      {list.map((u) => {
        const editable = canManage(user, u) && u.id !== user.id;
        const roles = u.role === 'owner' ? ['owner'] : user.role === 'owner' ? ROLES : ROLES.filter((x) => x !== 'admin' || u.role === 'admin');
        return (
          <div className="card" key={u.id}>
            <b>{u.name}</b>
            <small>
              {ROLE_LABELS[u.role]}{u.requestedType === 'rabbi' && u.role === 'student' ? ' (ביקש להירשם כרב)' : ''}
              {' · '}{u.phone} {u.email && `· ${u.email}`} · {shiurName(u.shiurId)} · {rabbis.find((x) => x.id === u.rabbiId)?.name || '—'}
              {u.studentStatus ? ` · ${STUDENT_STATUS[u.studentStatus]}` : ''} · {u.status === 'approved' ? 'מאושר' : 'ממתין'}
            </small>
            {editable && (
              <>
                <select value={u.role} onChange={(e) => updateUser(u.id, { role: e.target.value })}>
                  {roles.map((v) => <option key={v} value={v}>{ROLE_LABELS[v]}</option>)}
                </select>
                <select value={u.shiurId || ''} onChange={(e) => assignShiur(u, e.target.value)}>
                  <option value="">שיעור…</option>
                  {shiurim.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={u.rabbiId || ''} onChange={(e) => updateUser(u.id, { rabbiId: e.target.value })}>
                  <option value="">רב…</option>
                  {rabbis.filter((x) => x.shiurId === u.shiurId).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                {u.status !== 'approved'
                  ? <button className="primary" onClick={() => approve(u)}>אשר</button>
                  : <button onClick={() => updateUser(u.id, { status: 'pending' })}>השהה</button>}
                <button onClick={() => resetPw(u)}>איפוס סיסמה</button>
                <button onClick={() => confirm('למחוק משתמש?') && removeUser(u.id)}>מחק</button>
              </>
            )}
            {u.role === 'owner' && <small>מנהל ראשי – מוגן מפני שינוי</small>}
          </div>
        );
      })}
    </>
  );
}
