import { useState } from 'react';
import { AttachPicker, Attachment } from '../Attach.jsx';
import { useStore, set, uid, useClasses, classKey, isManager } from '../store.js';

export default function Classes({ user }) {
  const { shiurim, rabbis, contacts } = useClasses();
  const canPick = isManager(user);
  const [rabbiId, setRabbiId] = useState(user.rabbiId || rabbis[0]?.id || '');
  const rabbi = rabbis.find((r) => r.id === rabbiId);
  const shiur = shiurim.find((s) => s.id === (rabbi?.shiurId || user.shiurId));
  const key = classKey(shiur?.id || 'none');
  const items = useStore(key) || [];
  const [type, setType] = useState('summary');
  const [f, setF] = useState({ title: '', body: '', att: null });
  const canPost = (user.role === 'rabbi' && user.rabbiId === rabbiId) || canPick;
  const phone = contacts[rabbiId];

  const shown = items.filter((i) => i.rabbiId === rabbiId && i.type === type).sort((a, b) => b.ts - a.ts);

  const post = () => {
    if (!f.title.trim() && !f.att) return;
    if (!f.title.trim()) f.title = 'קובץ מצורף';
    set(key, [...items, { id: uid(), rabbiId, type, ...f, att: f.att || undefined, ts: Date.now() }]);
    setF({ title: '', body: '', att: null });
  };

  if (!rabbi) return <p className="hint">לא שויכת לרב. פנה להנהלת הישיבה.</p>;

  return (
    <>
      {canPick ? (
        <select value={rabbiId} onChange={(e) => setRabbiId(e.target.value)}>
          {shiurim.map((s) => (
            <optgroup key={s.id} label={s.name}>
              {rabbis.filter((r) => r.shiurId === s.id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </optgroup>
          ))}
        </select>
      ) : (
        <p className="hint">{shiur?.name} · {rabbi.name}</p>
      )}
      {phone && <a className="hint" href={`tel:${phone}`}>📞 התקשרות לרב: {phone}</a>}
      <div className="chips">
        <button className={type === 'summary' ? 'on' : ''} onClick={() => setType('summary')}>סיכומי שיעור</button>
        <button className={type === 'msg' ? 'on' : ''} onClick={() => setType('msg')}>הודעות הרב</button>
      </div>
      {canPost && (
        <div className="card">
          <b>{type === 'summary' ? 'סיכום חדש' : 'הודעה חדשה'}</b>
          <input placeholder="כותרת" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea placeholder="תוכן" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <AttachPicker user={user} onDone={(att) => setF({ ...f, att })} />
          {f.att && <small>צורף: {f.att.fileName}</small>}
          <button className="primary" onClick={post}>פרסם</button>
        </div>
      )}
      {shown.map((i, idx) => (
        <div className={'card' + (idx === 0 && type === 'summary' ? ' hl' : '')} key={i.id}>
          <small>{idx === 0 && type === 'summary' ? 'סיכום אחרון · ' : ''}{new Date(i.ts).toLocaleDateString('he-IL')}</small>
          <b>{i.title}</b>
          <p style={{ whiteSpace: 'pre-wrap' }}>{i.body}</p>
          <Attachment att={i.att} />
          {canPost && <button onClick={() => set(key, items.filter((x) => x.id !== i.id))}>מחק</button>}
        </div>
      ))}
      {!shown.length && <p className="hint">אין עדיין תוכן.</p>}
    </>
  );
}
