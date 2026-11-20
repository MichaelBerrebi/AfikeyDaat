import { useSyncExternalStore } from 'react';
import * as fb from './firebase.js';

const { cloudEnabled } = fb;
export { cloudEnabled };

const PREFIX = 'sy_';
const PHONE_DOMAIN = '@phone.yeshiva.app';
const listeners = new Set();

export const ROLE_LABELS = { owner: 'מנהל ראשי', admin: 'מנהל משנה', rosh: 'ראש ישיבה', rabbi: 'רב', student: 'תלמיד' };
export const STUDENT_STATUS = { active: 'תלמיד פעיל', army: 'בצבא' };

export const isManager = (u) => !!u && ['rosh', 'admin', 'owner'].includes(u.role);
// מנהל משנה לא יכול לשנות או למחוק את המנהל הראשי
export const canManage = (actor, target) => isManager(actor) && (target.role !== 'owner' || actor.role === 'owner');

// שמות בדויים – לעדכן דרך מסך הניהול
export const DEFAULT_CLASSES = {
  shiurim: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י'].map((l, i) => ({ id: 's' + (i + 1), name: `שיעור ${l}׳` })),
  rabbis: [
    { id: 'r1', name: 'הרב אברהם כהן', shiurId: 's1' },
    { id: 'r2', name: 'הרב יצחק לוי', shiurId: 's1' },
    { id: 'r3', name: 'הרב משה ישראלי', shiurId: 's2' },
    { id: 'r4', name: 'הרב דוד מזרחי', shiurId: 's2' },
    { id: 'r5', name: 'הרב יעקב בן דוד', shiurId: 's3' },
    { id: 'r6', name: 'הרב שמואל פרץ', shiurId: 's3' },
    { id: 'r7', name: 'הרב אליהו גולן', shiurId: 's4' },
    { id: 'r8', name: 'הרב נתן אזולאי', shiurId: 's4' },
  ],
};

const baseUser = { email: '', status: 'approved', rabbiId: '', shiurId: '', studentStatus: '', idHash: '' };

const SEED = {
  schedule: [
    { t: '06:30', title: 'תפילת שחרית' },
    { t: '07:30', title: 'ארוחת בוקר' },
    { t: '08:30', title: 'סדר א׳ – בבלי' },
    { t: '11:30', title: 'שיעור כללי' },
    { t: '13:00', title: 'תפילת מנחה' },
    { t: '13:30', title: 'ארוחת צהריים' },
    { t: '16:00', title: 'סדר ב׳ – הלכה' },
    { t: '18:30', title: 'תפילת מעריב' },
    { t: '19:00', title: 'ארוחת ערב' },
    { t: '20:00', title: 'סדר ג׳ – מוסר' },
  ],
  scheduleFri: [
    { t: '06:30', title: 'תפילת שחרית' },
    { t: '07:30', title: 'ארוחת בוקר' },
    { t: '08:30', title: 'סדר בוקר' },
    { t: '11:00', title: 'סיום סדרי הלימוד' },
    { t: '12:30', title: 'ארוחת צהריים' },
  ],
  posts: [
    { id: 'p1', cat: 'אבידה', title: 'נמצאה כיפה שחורה', body: 'בבית המדרש ליד ארון 3', author: 'דני', ts: Date.now() - 3600e3 },
    { id: 'p2', cat: 'טרמפים', title: 'טרמפ לירושלים', body: 'יוצא ביום ה׳ ב-14:00, 3 מקומות פנויים', author: 'יוסי', ts: Date.now() - 7200e3 },
    { id: 'p3', cat: 'החלפת ספרים', title: 'מחליף משנה ברורה ח״ג', body: 'מחפש אורח חיים ח״ד', author: 'אורי', ts: Date.now() - 9000e3 },
  ],
  books: [
    { id: 'b1', title: 'ספר לדוגמה א׳', price: 60, sale: 45, note: 'מבצע השבוע' },
    { id: 'b2', title: 'ספר לדוגמה ב׳', price: 90, sale: null, note: 'חדש' },
  ],
  // הכתובות לא אומתו – המנהל יכול לערוך אותן במסך הספרים
  bookLinks: [
    { id: 'l1', title: 'הוצאת עוז והדר', url: 'https://www.ozvehadar.co.il' },
    { id: 'l2', title: 'הוצאת מכון ירושלים', url: 'https://www.machonyerushalayim.org' },
    { id: 'l3', title: 'הוצאת מכון הרב קוק', url: 'https://www.mhrk.org.il' },
  ],
  events: [
    { id: 'e1', date: '2026-12-04', title: 'שבת ישיבה', kind: 'ישיבה' },
    { id: 'e2', date: '2026-12-11', title: 'שבת חופשית', kind: 'חופשית' },
    { id: 'e3', date: '2026-12-18', title: 'שבת ישיבה', kind: 'ישיבה' },
    { id: 'e4', date: '2026-12-25', title: 'שבת חופשית', kind: 'חופשית' },
  ],
  parasha: { title: '', url: '', text: 'ממתין להעלאת דף פרשת השבוע מההנהלה.' },
  roshMsgs: [{ id: 'm1', title: 'שיחה לקראת השבת', body: 'כאן יופיעו דברי ראש הישיבה.', ts: Date.now() }],
  classes: DEFAULT_CLASSES,
  roshPhoto: '',
  docs: {}, // קבצים מצורפים כלליים: schedule, scheduleFri, catalog, calendar
  appLinks: { youtube: 'https://www.youtube.com/results?search_query=%D7%90%D7%A4%D7%99%D7%A7%D7%99+%D7%93%D7%A2%D7%AA' },
  pages: {
    hosting: { text: 'פרטי האירוח יעודכנו בקרוב על ידי הנהלת הישיבה.' },
    memorial: { text: 'דף ההנצחות יעודכן בקרוב על ידי הנהלת הישיבה.' },
  },
  contacts: {}, // טלפונים של רבנים: { rabbiId: phone }
  photos: [],
  // משתמשי דמו: מופעלים רק כשאין Firebase
  users: [
    { ...baseUser, id: 'u0', name: 'מנהל ראשי', phone: '0544534345', role: 'owner', pwHash: 'ff2a789fb51fa47d789bf800682b03e4296d78f2936900c052df9fdae56d7209' },
    { ...baseUser, id: 'u1', name: 'אוריאל משה ברבי', phone: '0585343456', role: 'admin', pwHash: '8c648ee16b52dc2276ec6d8dcdc52e09bde04c90605a03be8bf646c4c271813b' },
  ],
  session: null,
};

export const classKey = (shiurId) => 'class_' + shiurId;
const SHARED_KEYS = ['schedule', 'scheduleFri', 'posts', 'books', 'bookLinks', 'events', 'parasha', 'roshMsgs', 'roshPhoto', 'docs', 'pages', 'appLinks', 'contacts'];
const defaults = (k) => (k in SEED ? SEED[k] : k.startsWith('class_') ? [] : undefined);

const cloud = {};
const notify = () => listeners.forEach((l) => l());

const read = (k) => {
  if (cloudEnabled) {
    if (k === 'users') return cloud.users || [];
    return k in cloud ? cloud[k] : defaults(k);
  }
  const raw = localStorage.getItem(PREFIX + k);
  const v = raw === null ? defaults(k) : JSON.parse(raw);
  if (k !== 'users') return v;
  // משתמשי הדמו תמיד שומרים על תפקיד וסיסמה מהקוד
  const ids = SEED.users.map((u) => u.id);
  const seeded = SEED.users.map((s) => {
    const stored = v.find((u) => u.id === s.id) || {};
    return { ...s, ...stored, role: s.role, status: 'approved', pwHash: s.pwHash };
  });
  return [...seeded, ...v.filter((u) => !ids.includes(u.id))];
};
export const get = read;
export const set = (k, v) => {
  if (cloudEnabled) {
    cloud[k] = v;
    fb.saveKey(k, v).catch(() => {});
  } else {
    localStorage.setItem(PREFIX + k, JSON.stringify(v));
  }
  notify();
};

let version = 0;
listeners.add(() => version++);
const subscribe = (cb) => (listeners.add(cb), () => listeners.delete(cb));

export function useStore(key) {
  useSyncExternalStore(subscribe, () => version);
  return read(key);
}

export function useClasses() {
  const c = useStore('classes');
  const contacts = useStore('contacts') || {};
  return { shiurim: c.shiurim, rabbis: c.rabbis, contacts };
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);

// ---- משתמשים והתחברות ----
const hashWith = async (salt, s) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
const pwHash = (pw) => hashWith('sy-pw:', pw);
export const hashId = (idNumber) => hashWith('sy-salt:', idNumber);

export const normPhone = (p) => {
  const d = String(p).replace(/\D/g, '');
  return d.startsWith('972') ? '0' + d.slice(3) : d;
};
const normId = (s) => (s.includes('@') ? s.trim().toLowerCase() : normPhone(s));
const authEmail = (identifier) => (identifier.includes('@') ? normId(identifier) : `${normId(identifier)}${PHONE_DOMAIN}`);
export const isRealEmail = (e) => Boolean(e) && !e.endsWith(PHONE_DOMAIN);

const SELF_EDITABLE = ['name', 'phone', 'email', 'studentStatus'];

const currentLocal = () => read('users').find((u) => u.id === read('session'));

const buildProfile = async (f) => ({
  name: f.name.trim(),
  phone: normPhone(f.phone),
  email: (f.email || '').trim().toLowerCase(),
  role: 'student',
  requestedType: f.userType === 'rabbi' ? 'rabbi' : 'student',
  status: 'pending',
  studentStatus: f.userType === 'rabbi' ? '' : f.studentStatus || 'active',
  shiurId: f.shiurId,
  rabbiId: f.rabbiId,
  idHash: await hashId(f.idNumber),
});

export async function register(f) {
  const profile = await buildProfile(f);
  if (cloudEnabled) {
    cloud.registering = true;
    try {
      const id = await fb.signUpEmail(authEmail(profile.email || profile.phone), f.password);
      await fb.saveProfile(id, profile);
      if (isRealEmail(profile.email)) await fb.sendVerify();
    } finally {
      cloud.registering = false;
      notify();
    }
    return;
  }
  const users = read('users');
  if (users.some((u) => u.phone === profile.phone || (profile.email && u.email === profile.email))) throw new Error('exists');
  const u = { id: uid(), ...profile, pwHash: await pwHash(f.password) };
  set('users', [...users, u]);
  set('session', u.id);
}

// משתמש שנכנס עם גוגל ועדיין אין לו פרופיל
export async function completeProfile(f) {
  const a = cloud.authUser;
  await fb.saveProfile(a.uid, await buildProfile({ ...f, email: a.email }));
}

export const googleSignIn = () => fb.googleSignIn();
export const resendVerification = () => fb.sendVerify();
export async function checkVerified() {
  if (await fb.reloadUser()) location.reload();
}

export async function login(identifier, password) {
  password = password.trim();
  if (cloudEnabled) return fb.signInEmail(authEmail(identifier), password);
  const h = await pwHash(password);
  const id = normId(identifier);
  const u = read('users').find((x) => (x.phone === id || x.email === id) && x.pwHash === h);
  if (!u) throw new Error('bad-credentials');
  set('session', u.id);
}

// איפוס סיסמה: במייל נשלח קישור; במצב מקומי מאמתים טלפון + ת"ז
export async function resetPassword({ identifier, idNumber, newPassword }) {
  if (cloudEnabled) {
    if (!identifier.includes('@')) throw new Error('phone-only');
    return fb.sendReset(normId(identifier));
  }
  const id = normId(identifier);
  const idHash = await hashId(idNumber);
  const u = read('users').find((x) => (x.phone === id || x.email === id) && x.idHash && x.idHash === idHash);
  if (!u) throw new Error('bad-credentials');
  updateUser(u.id, { pwHash: await pwHash(newPassword.trim()) }, true);
}

// איפוס סיסמה על ידי מנהל: במצב מקומי קובעים סיסמה חדשה; בענן נשלח מייל איפוס
export async function adminResetPassword(target, newPassword) {
  if (cloudEnabled) {
    if (!isRealEmail(target.email)) throw new Error('phone-only');
    return fb.sendReset(target.email);
  }
  const me = currentLocal();
  if (!me || !canManage(me, target)) throw new Error('forbidden');
  updateUser(target.id, { pwHash: await pwHash(newPassword.trim()) });
}

export function logout() {
  if (cloudEnabled) return fb.signOutCloud();
  set('session', null);
}

export function updateUser(id, patch, system = false) {
  if (cloudEnabled) return fb.saveProfile(id, patch);
  const users = read('users');
  const target = users.find((u) => u.id === id);
  const me = currentLocal();
  if (!system) {
    if (!me || !target) throw new Error('forbidden');
    if (me.id === id && !isManager(me)) {
      if (Object.keys(patch).some((k) => !SELF_EDITABLE.includes(k))) throw new Error('forbidden');
    } else if (!canManage(me, target) || (patch.role === 'owner' && me.role !== 'owner')) {
      throw new Error('forbidden');
    }
  }
  set('users', users.map((u) => (u.id === id ? { ...u, ...patch } : u)));
}

export function removeUser(id) {
  if (cloudEnabled) return fb.removeProfile(id);
  const users = read('users');
  const target = users.find((u) => u.id === id);
  const me = currentLocal();
  if (!me || !target || target.role === 'owner' || !canManage(me, target)) throw new Error('forbidden');
  set('users', users.filter((u) => u.id !== id));
}

// ---- קבצים מצורפים (תמונה / PDF): מסמך נפרד לכל קובץ, נטען לפי דרישה ----
export const MAX_PDF = 600 * 1024;
export async function attachFile(file, user) {
  let data;
  let type;
  if (file.type === 'application/pdf') {
    if (file.size > MAX_PDF) throw new Error('too-big');
    data = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    type = 'pdf';
  } else {
    data = await compressImage(file, 1400, 0.7);
    type = 'image';
  }
  const rec = { id: uid(), name: file.name, type, data, uid: user.id, ts: Date.now() };
  if (cloudEnabled) await fb.saveFileDoc(rec);
  else localStorage.setItem(PREFIX + 'file_' + rec.id, JSON.stringify(rec));
  return { fileId: rec.id, fileName: rec.name, fileType: type };
}
export async function loadFile(id) {
  if (cloudEnabled) return fb.getFileDoc(id);
  const raw = localStorage.getItem(PREFIX + 'file_' + id);
  return raw ? JSON.parse(raw) : null;
}

// ---- תמונות אירועים ----
export async function addPhoto({ data, caption, eventId, eventTitle }, user) {
  const p = { id: uid(), data, caption, eventId, eventTitle, uid: user.id, by: user.name, ts: Date.now() };
  if (cloudEnabled) return fb.addPhoto(p);
  set('photos', [p, ...read('photos')]);
}
export function removePhoto(id) {
  if (cloudEnabled) return fb.deletePhoto(id);
  set('photos', read('photos').filter((p) => p.id !== id));
}

// ---- מצב ענן: מאזינים לפי הרשאות המשתמש המחובר ----
if (cloudEnabled) {
  cloud.authReady = false;
  const classUnsubs = {};
  let unsubs = [];
  let unsubProfiles = null;
  let unsubMe = null;
  let unsubPhotos = null;

  const syncClassWatchers = () => {
    const p = cloud.me;
    const want = new Set();
    if (p?.status === 'approved') {
      if (isManager(p)) (cloud.classes || SEED.classes).shiurim.forEach((s) => want.add(classKey(s.id)));
      else if (p.shiurId) want.add(classKey(p.shiurId));
    }
    Object.keys(classUnsubs).forEach((k) => {
      if (!want.has(k)) { classUnsubs[k](); delete classUnsubs[k]; delete cloud[k]; }
    });
    want.forEach((k) => {
      if (!classUnsubs[k]) classUnsubs[k] = fb.watchKey(k, (v) => { cloud[k] = v; notify(); });
    });
  };

  // רשימת הכיתות והרבנים (בלי טלפונים) גלויה גם למי שעדיין לא נרשם
  fb.watchKey('classes', (v) => { cloud.classes = v; syncClassWatchers(); notify(); });

  fb.onAuth((a) => {
    unsubMe?.(); unsubs.forEach((f) => f()); unsubProfiles?.(); unsubPhotos?.();
    unsubMe = null; unsubs = []; unsubProfiles = null; unsubPhotos = null;
    cloud.me = null; cloud.users = []; cloud.photos = [];
    cloud.authUser = a ? { uid: a.uid, email: a.email || '', emailVerified: a.emailVerified, name: a.displayName || '' } : null;
    syncClassWatchers();
    if (!a) { cloud.authReady = true; return notify(); }
    unsubMe = fb.watchProfile(a.uid, (p) => {
      cloud.me = p;
      cloud.authReady = true;
      if (p?.status === 'approved' && !unsubs.length) {
        unsubs = SHARED_KEYS.map((k) => fb.watchKey(k, (v) => { cloud[k] = v; notify(); }));
        unsubPhotos = fb.watchPhotos((l) => { cloud.photos = l; notify(); });
      }
      if (isManager(p) && p.status === 'approved' && !unsubProfiles) unsubProfiles = fb.watchProfiles((l) => { cloud.users = l; notify(); });
      syncClassWatchers();
      notify();
    });
  });
}

export function useCurrentUser() {
  useSyncExternalStore(subscribe, () => version);
  if (cloudEnabled) {
    const au = cloud.authUser;
    return {
      user: cloud.me || null,
      ready: cloud.authReady,
      needsProfile: Boolean(au && !cloud.me && !cloud.registering),
      needsVerify: Boolean(au && isRealEmail(au.email) && !au.emailVerified),
      authUser: au,
    };
  }
  const id = read('session');
  return { user: read('users').find((u) => u.id === id) || null, ready: true };
}

export const validIsraeliId = (s) => {
  s = String(s).padStart(9, '0');
  if (!/^\d{9}$/.test(s)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let n = +s[i] * ((i % 2) + 1);
    if (n > 9) n -= 9;
    sum += n;
  }
  return sum % 10 === 0;
};

export const validPhone = (p) => /^05\d{8}$/.test(normPhone(p));
export const validEmail = (e) => /^\S+@\S+\.\S+$/.test((e || '').trim());

// פרופיל חובה: שם מלא, טלפון, מייל, כיתה, ורב/סטטוס. מנהלים פטורים.
export const isProfileComplete = (u) => {
  if (!u) return false;
  if (['owner', 'admin', 'rosh'].includes(u.role)) return true;
  const isRabbi = u.role === 'rabbi' || u.requestedType === 'rabbi';
  return Boolean(
    (u.name || '').trim().split(/\s+/).length >= 2 &&
      validPhone(u.phone || '') &&
      validEmail(u.email) &&
      u.shiurId &&
      (isRabbi ? u.rabbiId : u.studentStatus)
  );
};

// דחיסת תמונה לאחסון ב-Firestore (אין Storage בתוכנית החינמית)
export function compressImage(file, max = 1000, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('bad-image'));
    img.src = url;
  });
}
