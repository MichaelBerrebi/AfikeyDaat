import { useStore, updateUser, removeUser, RABBIS, SHIURIM } from '../store.js';

const ROLES = [['student', 'תלמיד'], ['rabbi', 'רב'], ['rosh', 'ראש ישיבה'], ['admin', 'אדמין']];

export default function Admin({ user }) {
  const users = useStore('users');
  const rabbiName = (id) => RABBIS.find((r) => r.id === id)?.name || '—';
  const assignRabbi = (u, rabbiId) => {
    const r = RABBIS.find((x) => x.id === rabbiId);
    updateUser(u.id, { rabbiId, ...(r ? { shiur: r.shiur, shiurIdx: SHIURIM.indexOf(r.shiur) } : {}) });
  };

  return (
    <>
      <p className="hint">אישור משתמשים וניהול הרשאות</p>
      {users.map((u) => (
        <div className="card" key={u.id}>
          <b>{u.name}</b>
          <small>{u.phone} {u.email && `· ${u.email}`} · {u.shiur || ''} · {rabbiName(u.rabbiId)} · {u.status === 'approved' ? 'מאושר' : 'ממתין'}</small>
          <select value={u.role} disabled={u.id === user.id} onChange={(e) => updateUser(u.id, { role: e.target.value })}>
            {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {u.role === 'rabbi' && (
            <select value={u.rabbiId || ''} onChange={(e) => assignRabbi(u, e.target.value)}>
              <option value="">שייך לרב…</option>
              {RABBIS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          )}
          {u.status !== 'approved' ? (
            <button className="primary" onClick={() => updateUser(u.id, { status: 'approved' })}>אשר</button>
          ) : u.id !== user.id && <button onClick={() => updateUser(u.id, { status: 'pending' })}>השהה</button>}
          {u.id !== user.id && <button onClick={() => removeUser(u.id)}>מחק</button>}
        </div>
      ))}
    </>
  );
}
