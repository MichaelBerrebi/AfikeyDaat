import { useState } from 'react';
import { useStore, set, isManager } from '../store.js';

// העלאה מותרת להנהלה בלבד; תלמידים קוראים בלבד
export default function Parasha({ user }) {
  const p = useStore('parasha');
  const [f, setF] = useState(p);

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 600 * 1024) return alert('הקובץ גדול מדי (עד 600KB, מגבלת האחסון החינמי). אפשר לדחוס את ה-PDF.');
    const r = new FileReader();
    r.onload = () => setF({ ...f, url: r.result, title: file.name });
    r.readAsDataURL(file);
  };

  return (
    <>
      {p.url && (
        <div className="card">
          <b>{p.title}</b>
          <a href={p.url} download={p.title}>הורדה / צפייה</a>
        </div>
      )}
      {p.text && <div className="card"><p style={{ whiteSpace: 'pre-wrap' }}>{p.text}</p></div>}
      {isManager(user) && (
        <div className="card">
          <b>עדכון דף פרשת שבוע</b>
          <input type="file" accept="application/pdf,image/*" onChange={onFile} />
          <textarea placeholder="טקסט (אופציונלי)" value={f.text} onChange={(e) => setF({ ...f, text: e.target.value })} />
          <button className="primary" onClick={() => set('parasha', f)}>שמור</button>
        </div>
      )}
    </>
  );
}
