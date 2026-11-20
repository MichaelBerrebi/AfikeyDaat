import { useState } from 'react';
import { useStore, addPhoto, removePhoto, compressImage, isManager } from '../store.js';

export default function Events({ user }) {
  const photos = useStore('photos') || [];
  const events = useStore('events').filter((e) => e.id && e.kind === 'אירוע');
  const [eventId, setEventId] = useState('');
  const [caption, setCaption] = useState('');
  const [filter, setFilter] = useState('');
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const upload = async (e) => {
    setErr(''); setBusy(true);
    try {
      for (const file of e.target.files) {
        const data = await compressImage(file);
        const ev = events.find((x) => x.id === eventId);
        await addPhoto({ data, caption, eventId, eventTitle: ev?.title || '' }, user);
      }
      setCaption('');
    } catch { setErr('העלאת התמונה נכשלה'); }
    setBusy(false);
    e.target.value = '';
  };
  const shown = photos.filter((p) => !filter || p.eventId === filter);

  return (
    <>
      <div className="card">
        <b>העלאת תמונות</b>
        <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">ללא שיוך לאירוע</option>
          {events.map((v) => <option key={v.id} value={v.id}>{v.title} · {v.date}</option>)}
        </select>
        <input placeholder="כיתוב (אופציונלי)" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <input type="file" accept="image/*" multiple disabled={busy} onChange={upload} />
        {busy && <p className="hint">מעלה…</p>}
        {err && <p className="err">{err}</p>}
      </div>
      {events.length > 0 && (
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">כל התמונות</option>
          {events.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
        </select>
      )}
      <div className="thumbs">
        {shown.map((p) => <img key={p.id} src={p.data} alt={p.caption || ''} onClick={() => setView(p)} />)}
      </div>
      {!shown.length && <p className="hint">אין עדיין תמונות.</p>}
      {view && (
        <div className="viewer">
          <img src={view.data} alt="" />
          <small>{[view.eventTitle, view.caption, view.by].filter(Boolean).join(' · ')}</small>
          <div className="row-btns">
            {(view.uid === user.id || isManager(user)) && <button onClick={() => { removePhoto(view.id); setView(null); }}>מחק</button>}
            <button onClick={() => setView(null)}>סגור</button>
          </div>
        </div>
      )}
    </>
  );
}
