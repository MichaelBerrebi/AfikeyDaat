import { useState } from 'react';
import { useStore, set, isManager } from '../store.js';
import { DocSlot } from '../Attach.jsx';

// עמוד תוכן שהמנהל עורך (טקסט + קובץ מצורף)
export default function InfoPage({ user, name }) {
  const pages = useStore('pages') || {};
  const text = pages[name]?.text || '';
  const [edit, setEdit] = useState(false);
  const [t, setT] = useState(text);
  const manager = isManager(user);
  return (
    <>
      <div className="card">
        {edit ? <textarea style={{ minHeight: 200 }} value={t} onChange={(e) => setT(e.target.value)} /> : <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>}
        {manager && (
          <button onClick={() => { if (edit) set('pages', { ...pages, [name]: { text: t } }); else setT(text); setEdit(!edit); }}>
            {edit ? 'שמור' : 'עריכת טקסט'}
          </button>
        )}
      </div>
      <DocSlot name={'page_' + name} user={user} manager={manager} label="קובץ מצורף (תמונה / PDF)" />
    </>
  );
}
