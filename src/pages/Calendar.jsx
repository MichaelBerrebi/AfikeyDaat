import { useEffect, useState } from 'react';
import { DocSlot } from '../Attach.jsx';
import { useStore, set, uid, isManager } from '../store.js';
import { getMonth } from '../hebcal.js';

const CAL_PDF = 'https://hesder.org.il/wp-content/uploads/2026/07/%D7%9C%D7%95%D7%97_%D7%A9%D7%A0%D7%94_%D7%AA%D7%A9%D7%A4%D7%96.pdf';

export default function Calendar({ user }) {
  const events = useStore('events');
  const [ym, setYm] = useState(() => { const d = new Date(); return [d.getFullYear(), d.getMonth() + 1]; });
  const [heb, setHeb] = useState([]);
  const [f, setF] = useState({ date: '', title: '', kind: 'ישיבה' });

  useEffect(() => { getMonth(...ym).then(setHeb).catch(() => setHeb([])); }, [ym]);

  const key = `${ym[0]}-${String(ym[1]).padStart(2, '0')}`;
  const mine = events.filter((e) => e.date.startsWith(key));
  const all = [
    ...mine.map((e) => ({ ...e, own: true })),
    ...heb.filter((h) => true).map((h) => ({ date: h.date.slice(0, 10), title: h.hebrew || h.title, kind: h.category === 'parashat' ? 'פרשה' : 'חג/מועד' })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const shift = (n) => {
    const d = new Date(ym[0], ym[1] - 1 + n, 1);
    setYm([d.getFullYear(), d.getMonth() + 1]);
  };
  const add = () => {
    if (!f.date || !f.title) return;
    set('events', [...events, { id: uid(), ...f }]);
    setF({ date: '', title: '', kind: 'ישיבה' });
  };

  const remove = (e) => set('events', events.filter((x) => (e.id ? x.id !== e.id : !(x.date === e.date && x.title === e.title))));
  // שבת: ללא סימון ← שבת ישיבה ← שבת חופשית ← ללא
  const cycleShabbat = (date) => {
    const cur = events.find((x) => x.date === date && x.kind !== 'אירוע');
    const rest = events.filter((x) => x !== cur);
    if (!cur) set('events', [...rest, { id: uid(), date, title: 'שבת ישיבה', kind: 'ישיבה' }]);
    else if (cur.kind === 'ישיבה') set('events', [...rest, { id: uid(), date, title: 'שבת חופשית', kind: 'חופשית' }]);
    else set('events', rest);
  };
  const manager = isManager(user);

  return (
    <>
      <div className="card">
        <b>לוח השנה של הישיבה</b>
        <a className="primary-link" href={CAL_PDF} target="_blank" rel="noreferrer">📄 פתח את לוח השנה תשפ״ז (PDF)</a>
        <small>השבתות (ישיבה / חופשית) מסומנות בשורות הפרשה למטה – המנהל מעדכן לפי הלוח.</small>
      </div>
      <DocSlot name="calendar" user={user} manager={manager} label="לוח שנה כקובץ (תמונה / PDF)" />
      <div className="card row">
        <button onClick={() => shift(-1)}>→</button>
        <b>{new Date(ym[0], ym[1] - 1).toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}</b>
        <button onClick={() => shift(1)}>←</button>
      </div>
      {all.map((e, i) => (
        <div className={'card row ev-' + e.kind} key={i}>
          <span>{new Date(e.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', weekday: 'short' })}</span>
          <b>{e.title}</b>
          {manager && e.own && <button onClick={() => remove(e)}>מחק</button>}
          {manager && e.kind === 'פרשה' && <button onClick={() => cycleShabbat(e.date)}>שבת ישיבה/חופשית</button>}
        </div>
      ))}
      {isManager(user) && (
        <div className="card">
          <b>הוספת אירוע / שבת</b>
          <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
          <input placeholder="כותרת" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            <option>ישיבה</option><option>חופשית</option><option>אירוע</option>
          </select>
          <button className="primary" onClick={add}>הוסף</button>
        </div>
      )}
    </>
  );
}
