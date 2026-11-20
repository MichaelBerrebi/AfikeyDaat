import { useEffect, useState } from 'react';
import { useStore, isManager } from '../store.js';
import { getParashaName, getZmanim, getDafYomi } from '../hebcal.js';
import RoshPhoto from '../RoshPhoto.jsx';
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
      <div className="banner">
        <img src={`${import.meta.env.BASE_URL}building.jpg`} alt="בית המדרש" />
        <img className="banner-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="לוגו הישיבה" />
      </div>
      <p className="hello">שלום, {user.name}</p>
      {last && (
        <div className="card hl rosh-card" onClick={() => go('rosh')}>
          <small>דבר ראש הישיבה</small>
          <b>{last.title}</b>
          {last.body && <p className="clamp">{last.body}</p>}
        </div>
      )}
      <div className="card hl">
        <small>הבא בסדר היום</small>
        <b>{next ? `${next.t} · ${next.title}` : 'סיום סדר היום'}</b>
      </div>
      <div className="card row">
        {parasha && <span>📜 {parasha}</span>}
        {daf && <span>📖 {daf}</span>}
        {shkia && <span>🌇 שקיעה {shkia}</span>}
      </div>
      <div className="grid">
        {Object.entries(SCREENS)
          .filter(([, s]) => !s.managerOnly || isManager(user))
          .map(([k, s]) => (
            <button key={k} onClick={() => go(k)}>
              <span>{s.icon === 'ROSH' ? <RoshPhoto size={44} /> : s.icon}</span>
              {s.title}
            </button>
          ))}
      </div>
    </>
  );
}
