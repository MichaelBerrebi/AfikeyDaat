import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { loadRem, saveRem, testNotification, REM_CATS } from '../reminders.js';

export default function Reminders() {
  const [s, setS] = useState(loadRem);
  const [msg, setMsg] = useState('');
  const upd = (next) => { setS(next); saveRem(next); };
  const native = Capacitor.isNativePlatform();

  return (
    <>
      {!native && <p className="hint">התזכורות פעילות באפליקציית האנדרואיד בלבד.</p>}
      <div className="card">
        <label className="row"><b>תזכורות בשורת ההתראות</b>
          <input type="checkbox" style={{ width: 24 }} checked={s.on} onChange={(e) => upd({ ...s, on: e.target.checked })} />
        </label>
        <label>זמן התזכורת לפני האירוע:
          <select value={s.mins} onChange={(e) => upd({ ...s, mins: +e.target.value })}>
            {[0, 5, 10, 15, 30].map((m) => <option key={m} value={m}>{m ? `${m} דקות לפני` : 'בזמן'}</option>)}
          </select>
        </label>
        {Object.entries(REM_CATS).map(([k, l]) => (
          <label className="row" key={k}>{l}
            <input type="checkbox" style={{ width: 24 }} checked={!!s.cats[k]} onChange={(e) => upd({ ...s, cats: { ...s.cats, [k]: e.target.checked } })} />
          </label>
        ))}
        <button onClick={async () => setMsg((await testNotification()) ? 'התראת בדיקה תגיע בעוד 5 שניות' : 'אין הרשאת התראות')}>שלח התראת בדיקה</button>
        {msg && <p className="hint">{msg}</p>}
      </div>
      <p className="hint">התזכורות נקבעות במכשיר לפי סדר היום (ראשון–חמישי ושישי בנפרד) ולפי האירועים בלוח השנה, והן מתעדכנות אוטומטית כשההנהלה משנה את הלו״ז.</p>
    </>
  );
}
