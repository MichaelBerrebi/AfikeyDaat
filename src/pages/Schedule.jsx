import { useState } from 'react';
import { useStore, set, isManager } from '../store.js';

export default function Schedule({ user }) {
  const schedule = useStore('schedule');
  const [edit, setEdit] = useState(false);
  const manager = isManager(user);

  const upd = (i, k, v) => set('schedule', schedule.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const del = (i) => set('schedule', schedule.filter((_, j) => j !== i));
  const add = () => set('schedule', [...schedule, { t: '00:00', title: 'חדש' }]);
  const sorted = (a) => [...a].sort((x, y) => x.t.localeCompare(y.t));

  return (
    <>
      {manager && <button onClick={() => { if (edit) set('schedule', sorted(schedule)); setEdit(!edit); }}>{edit ? 'שמור' : 'עריכה'}</button>}
      <p className="hint">סדר היום (חול). לבדיקת שינויים חריגים – ראה הודעות ראש הישיבה.</p>
      {schedule.map((s, i) =>
        edit ? (
          <div className="card row" key={i}>
            <input type="time" value={s.t} onChange={(e) => upd(i, 't', e.target.value)} />
            <input value={s.title} onChange={(e) => upd(i, 'title', e.target.value)} />
            <button onClick={() => del(i)}>🗑</button>
          </div>
        ) : (
          <div className="card row" key={i}><b>{s.t}</b><span>{s.title}</span></div>
        )
      )}
      {edit && <button onClick={add}>+ הוסף שורה</button>}
    </>
  );
}
