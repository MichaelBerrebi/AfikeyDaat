import { useEffect, useState } from 'react';
import { getShabbatTimes } from './hebcal.js';

export default function ShabbatTimes() {
  const [t, setT] = useState(null);
  useEffect(() => { getShabbatTimes().then(setT).catch(() => {}); }, []);
  if (!t) return null;
  return (
    <div className="card hl">
      <b>שבת {t.parasha || ''}</b>
      <div className="row"><span>🕯️ כניסת שבת</span><b>{t.candles}</b></div>
      <div className="row"><span>✨ צאת שבת</span><b>{t.havdalah}</b></div>
      {t.rabbeinuTam && <div className="row"><span>🌌 צאת שבת – רבנו תם</span><b>{t.rabbeinuTam}</b></div>}
    </div>
  );
}
