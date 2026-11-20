import { useState } from 'react';
import { useStore, set, uid, isManager } from '../store.js';

export default function Books({ user }) {
  const books = useStore('books');
  const links = useStore('bookLinks');
  const [lf, setLf] = useState({ title: '', url: '' });
  const [orders, setOrders] = useState({});
  const [f, setF] = useState({ title: '', price: '', sale: '', note: '' });
  const manager = isManager(user);

  const add = () => {
    if (!f.title) return;
    set('books', [...books, { id: uid(), title: f.title, price: +f.price || 0, sale: f.sale ? +f.sale : null, note: f.note }]);
    setF({ title: '', price: '', sale: '', note: '' });
  };

  const addLink = () => {
    if (!lf.title.trim() || !lf.url.trim()) return;
    const url = /^https?:\/\//.test(lf.url.trim()) ? lf.url.trim() : 'https://' + lf.url.trim();
    set('bookLinks', [...links, { id: uid(), title: lf.title.trim(), url }]);
    setLf({ title: '', url: '' });
  };

  return (
    <>
      <div className="card">
        <b>הוצאות ואתרים</b>
        {links.map((l) => (
          <div className="row" key={l.id}>
            <a href={l.url} target="_blank" rel="noreferrer">🔗 {l.title}</a>
            {manager && <button onClick={() => set('bookLinks', links.filter((x) => x.id !== l.id))}>מחק</button>}
          </div>
        ))}
        {manager && (
          <>
            <input placeholder="שם האתר" value={lf.title} onChange={(e) => setLf({ ...lf, title: e.target.value })} />
            <input placeholder="כתובת (https://…)" dir="ltr" value={lf.url} onChange={(e) => setLf({ ...lf, url: e.target.value })} />
            <button onClick={addLink}>הוסף קישור</button>
          </>
        )}
      </div>
      {books.map((b) => (
        <div className="card" key={b.id}>
          <b>{b.title}</b>
          {b.note && <small>{b.note}</small>}
          <p>
            {b.sale ? <><s>₪{b.price}</s> <b>₪{b.sale}</b></> : <>₪{b.price}</>}
          </p>
          <button onClick={() => setOrders({ ...orders, [b.id]: true })} disabled={orders[b.id]}>
            {orders[b.id] ? 'נשלחה בקשה ✔' : 'הזמן'}
          </button>
          {manager && <button onClick={() => set('books', books.filter((x) => x.id !== b.id))}>מחק</button>}
        </div>
      ))}
      {manager && (
        <div className="card">
          <b>הוספת ספר</b>
          <input placeholder="שם הספר" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <input placeholder="מחיר" inputMode="numeric" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          <input placeholder="מחיר מבצע (אופציונלי)" inputMode="numeric" value={f.sale} onChange={(e) => setF({ ...f, sale: e.target.value })} />
          <input placeholder="הערה (חדש/מבצע)" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <button className="primary" onClick={add}>הוסף</button>
        </div>
      )}
      <p className="hint">הזמנות יישלחו לאוצר הספרים לאחר חיבור שרת.</p>
    </>
  );
}
