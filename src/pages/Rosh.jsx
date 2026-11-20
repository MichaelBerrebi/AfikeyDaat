import { useState } from 'react';
import { useStore, set, uid, isManager, compressImage } from '../store.js';
import { AttachPicker, Attachment } from '../Attach.jsx';
import RoshPhoto from '../RoshPhoto.jsx';

export default function Rosh({ user }) {
  const msgs = useStore('roshMsgs');
  const [f, setF] = useState({ title: '', body: '', att: null });
  const post = () => {
    if (!f.title.trim() && !f.att) return;
    if (!f.title.trim()) f.title = 'קובץ מצורף';
    set('roshMsgs', [{ id: uid(), ...f, att: f.att || undefined, ts: Date.now() }, ...msgs]);
    setF({ title: '', body: '', att: null });
  };
  const pickPhoto = async (e) => {
    const file = e.target.files[0];
    if (file) set('roshPhoto', await compressImage(file, 400, 0.8));
  };
  return (
    <>
      <div style={{ textAlign: 'center' }}><RoshPhoto size={110} /></div>
      {isManager(user) && (
        <label className="hint">החלפת תמונת ראש הישיבה: <input type="file" accept="image/*" onChange={pickPhoto} /></label>
      )}
      {isManager(user) && (
        <div className="card">
          <input placeholder="כותרת" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea placeholder="הודעה / דברי תורה" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <AttachPicker user={user} onDone={(att) => setF({ ...f, att })} />
          {f.att && <small>צורף: {f.att.fileName}</small>}
          <button className="primary" onClick={post}>פרסם</button>
        </div>
      )}
      {msgs.map((m) => (
        <div className="card" key={m.id}>
          <small>{new Date(m.ts).toLocaleDateString('he-IL')}</small>
          <b>{m.title}</b>
          <p style={{ whiteSpace: 'pre-wrap' }}>{m.body}</p>
          <Attachment att={m.att} />
          {isManager(user) && <button onClick={() => set('roshMsgs', msgs.filter((x) => x.id !== m.id))}>מחק</button>}
        </div>
      ))}
    </>
  );
}
