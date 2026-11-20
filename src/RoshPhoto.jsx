import { useState } from 'react';
import { useStore } from './store.js';

// תמונת ראש הישיבה: מהאפליקציה (ניהול) או מהקובץ public/rosh.jpg; בלי תמונה – נר
export default function RoshPhoto({ size = 44 }) {
  const custom = useStore('roshPhoto');
  const [bad, setBad] = useState(false);
  if (bad && !custom) return <span style={{ fontSize: size * 0.8 }}>🕯️</span>;
  return (
    <img
      className="rosh-img"
      style={{ width: size, height: size }}
      alt="ראש הישיבה"
      src={custom || `${import.meta.env.BASE_URL}rosh.jpg`}
      onError={() => setBad(true)}
    />
  );
}
