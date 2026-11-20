import { useState } from 'react';
import { useStore, set, uid, RABBIS, SHIURIM, classKey, isManager } from '../store.js';

export default function Classes({ user }) {
  const canPick = isManager(user);
  const [rabbiId, setRabbiId] = useState(user.rabbiId || RABBIS[0].id);
  const rabbi = RABBIS.find((r) => r.id === rabbiId);
  const key = classKey(rabbi?.shiur);
  const items = useStore(key);
  const [type, setType] = useState('summary');
  const [f, setF] = useState({ title: '', body: '' });
  const canPost = (user.role === 'rabbi' && user.rabbiId === rabbiId) || canPick;

  const shown = items.filter((i) => i.rabbiId === rabbiId && i.type === type).sort((a, b) => b.ts - a.ts);

  const post = () => {
    if (!f.title.trim()) return;
    set(key, [...items, { id: uid(), rabbiId, type, ...f, ts: Date.now() }]);
    setF({ title: '', body: '' });
  };

  return (
    <>
      {canPick ? (
        <select value={rabbiId} onChange={(e) => setRabbiId(e.target.value)}>
          {SHIURIM.map((s) => (
            <optgroup key={s} label={s}>
              {RABBIS.filter((r) => r.shiur === s).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </optgroup>
          ))}
        </select>
      ) : (
        <p className="hint">{rabbi?.shiur} · {rabbi?.name}</p>
      )}
      <div className="chips">
        <button className={type === 'summary' ? 'on' : ''} onClick={() => setType('summary')}>סיכומי שיעור</button>
        <button className={type === 'msg' ? 'on' : ''} onClick={() => setType('msg')}>הודעות הרב</button>
      </div>
      {canPost && (
        <div className="card">
          <b>{type === 'summary' ? 'סיכום חדש' : 'הודעה חדשה'}</b>
          <input placeholder="כותרת" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea placeholder="תוכן" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <button className="primary" onClick={post}>פרסם</button>
        </div>
      )}
      {shown.map((i, idx) => (
        <div className={'card' + (idx === 0 && type === 'summary' ? ' hl' : '')} key={i.id}>
          <small>{idx === 0 && type === 'summary' ? 'סיכום אחרון · ' : ''}{new Date(i.ts).toLocaleDateString('he-IL')}</small>
          <b>{i.title}</b>
          <p style={{ whiteSpace: 'pre-wrap' }}>{i.body}</p>
        </div>
      ))}
      {!shown.length && <p className="hint">אין עדיין תוכן.</p>}
    </>
  );
}
