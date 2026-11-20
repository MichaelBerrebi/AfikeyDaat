import { useState } from 'react';
import { useStore, set, uid, isManager } from '../store.js';

const CATS = ['אבידה', 'טרמפים', 'החלפת ספרים', 'כללי'];

export default function Board({ user }) {
  const posts = useStore('posts');
  const [cat, setCat] = useState('הכל');
  const [f, setF] = useState({ cat: CATS[0], title: '', body: '' });
  const [open, setOpen] = useState(false);

  const publish = () => {
    if (!f.title.trim()) return;
    set('posts', [{ id: uid(), ...f, author: user.name, uid: user.id, ts: Date.now() }, ...posts]);
    setF({ cat: CATS[0], title: '', body: '' });
    setOpen(false);
  };
  const remove = (id) => set('posts', posts.filter((p) => p.id !== id));
  const shown = posts.filter((p) => cat === 'הכל' || p.cat === cat);

  return (
    <>
      <div className="chips">
        {['הכל', ...CATS].map((c) => (
          <button key={c} className={c === cat ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>
      <button className="primary" onClick={() => setOpen(!open)}>+ מודעה חדשה</button>
      {open && (
        <div className="card">
          <select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
            {CATS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="כותרת" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea placeholder="פרטים" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <button className="primary" onClick={publish}>פרסם</button>
        </div>
      )}
      {shown.map((p) => (
        <div className="card" key={p.id}>
          <small>{p.cat} · {p.author} · {new Date(p.ts).toLocaleString('he-IL')}</small>
          <b>{p.title}</b>
          <p>{p.body}</p>
          {(p.uid === user.id || isManager(user)) && <button onClick={() => remove(p.id)}>מחק</button>}
        </div>
      ))}
      {!shown.length && <p className="hint">אין מודעות.</p>}
    </>
  );
}
