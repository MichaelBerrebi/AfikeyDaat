import { useEffect, useState } from 'react';
import { getZmanim } from '../hebcal.js';
import ShabbatTimes from '../ShabbatTimes.jsx';

const LABELS = [
  ['alotHaShachar', 'עלות השחר'],
  ['misheyakir', 'משיכיר'],
  ['sunrise', 'הנץ החמה'],
  ['sofZmanShma', 'סוף זמן ק״ש (גר״א)'],
  ['sofZmanShmaMGA', 'סוף זמן ק״ש (מג״א)'],
  ['sofZmanTfilla', 'סוף זמן תפילה'],
  ['chatzot', 'חצות היום'],
  ['minchaGedola', 'מנחה גדולה'],
  ['minchaKetana', 'מנחה קטנה'],
  ['plagHaMincha', 'פלג המנחה'],
  ['sunset', 'שקיעה'],
  ['tzeit85deg', 'צאת הכוכבים'],
];

export default function Zmanim() {
  const [times, setTimes] = useState(null);
  const [err, setErr] = useState(false);
  useEffect(() => { getZmanim().then(setTimes).catch(() => setErr(true)); }, []);

  if (err) return <p className="err">אין חיבור לאינטרנט – לא ניתן לטעון זמנים.</p>;
  if (!times) return <p>טוען…</p>;
  return (
    <>
      <ShabbatTimes />
      <p className="hint">שדרות · היום</p>
      {LABELS.filter(([k]) => times[k]).map(([k, l]) => (
        <div className="card row" key={k}><span>{l}</span><b>{times[k].slice(11, 16)}</b></div>
      ))}
    </>
  );
}
