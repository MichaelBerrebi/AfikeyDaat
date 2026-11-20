import { useEffect, useState } from 'react';
import { useStore } from '../store.js';
import { getParashaName, getZmanim, getDafYomi } from '../hebcal.js';
import { SCREENS } from '../App.jsx';

const nowHM = () => new Date().toTimeString().slice(0, 5);

export default function Home({ user, go }) {
  const schedule = useStore('schedule');
  const roshMsgs = useStore('roshMsgs');
  const [parasha, setParasha] = useState(null);
  const [daf, setDaf] = useState(null);
  const [shkia, setShkia] = useState(null);

  useEffect(() => {
    getParashaName().then(setParasha).catch(() => {});
    getDafYomi().then(setDaf).catch(() => {});
    getZmanim().then((t) => setShkia(t.sunset?.slice(11, 16))).catch(() => {});
  }, []);

  const next = schedule.find((s) => s.t >= nowHM());
  const last = roshMsgs[0];

  return (
    <>
      <p className="hello">שלום, {user.name}</p>
      <div className="card hl">
        <small>הבא בסדר היום</small>
        <b>{next ? `${next.t} · ${next.title}` : 'סיום סדר היום'}</b>
      </div>
      <div className="card row">
        {parasha && <span>📜 {parasha}</span>}
        {daf && <span>📖 {daf}</span>}
        {shkia && <span>🌇 שקיעה {shkia}</span>}
      </div>
      {last && (
        <div className="card">
          <small>מראש הישיבה</small>
          <b>{last.title}</b>
        </div>
      )}
      <div className="grid">
        {Object.entries(SCREENS)
          .filter(([, s]) => !s.managerOnly || ['rosh', 'admin'].includes(user.role))
          .map(([k, s]) => (
            <button key={k} onClick={() => go(k)}>
              <span>{s.icon}</span>
              {s.title}
            </button>
          ))}
      </div>
    </>
  );
}
