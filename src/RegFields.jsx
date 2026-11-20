import { useClasses, validIsraeliId, validPhone, validEmail, STUDENT_STATUS } from './store.js';

export const emptyReg = { userType: 'student', studentStatus: 'active', name: '', phone: '', email: '', shiurId: '', rabbiId: '', idNumber: '' };

export function validateReg(f, { emailRequired = false } = {}) {
  if (f.name.trim().split(/\s+/).length < 2) return 'נא למלא שם מלא';
  if (!validPhone(f.phone)) return 'מספר טלפון לא תקין (05XXXXXXXX)';
  if (emailRequired ? !validEmail(f.email) : f.email && !validEmail(f.email)) return 'כתובת מייל לא תקינה';
  if (!f.shiurId) return 'נא לבחור שיעור';
  if (!f.rabbiId) return 'נא לבחור רב';
  if (!validIsraeliId(f.idNumber)) return 'תעודת זהות לא תקינה';
  return '';
}

export default function RegFields({ f, setF, hideEmail }) {
  const { shiurim, rabbis } = useClasses();
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <>
      <select value={f.userType} onChange={up('userType')}>
        <option value="student">אני תלמיד</option>
        <option value="rabbi">אני ר״מ בישיבה (דורש אישור הנהלה)</option>
      </select>
      <input placeholder="שם מלא" value={f.name} onChange={up('name')} />
      <input placeholder="טלפון (05XXXXXXXX)" inputMode="tel" value={f.phone} onChange={up('phone')} />
      {!hideEmail && <input placeholder="מייל (אופציונלי – אפשר להתחבר איתו)" type="email" value={f.email} onChange={up('email')} />}
      {f.userType === 'student' && (
        <select value={f.studentStatus} onChange={up('studentStatus')}>
          {Object.entries(STUDENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      )}
      <select value={f.shiurId} onChange={(e) => setF({ ...f, shiurId: e.target.value, rabbiId: '' })}>
        <option value="">בחר שיעור…</option>
        {shiurim.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <select value={f.rabbiId} onChange={up('rabbiId')}>
        <option value="">{f.userType === 'rabbi' ? 'בחר את עצמך…' : 'בחר ר״מ…'}</option>
        {rabbis.filter((r) => r.shiurId === f.shiurId).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
      </select>
      <input placeholder="תעודת זהות" inputMode="numeric" value={f.idNumber} onChange={up('idNumber')} />
    </>
  );
}
