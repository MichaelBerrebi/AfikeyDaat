import { useSyncExternalStore } from 'react';
import * as fb from './firebase.js';

const { cloudEnabled } = fb;
export { cloudEnabled };

// שכבת נתונים: כרגע localStorage. בהמשך מחליפים ב-Firebase/שרת בלי לגעת במסכים.
const PREFIX = 'sy_';
const listeners = new Set();

export const SHIURIM = ['שיעור א׳', 'שיעור ב׳', 'שיעור ג׳', 'שיעור ד׳'];

// שמות בדויים – לעדכן בהמשך
export const RABBIS = [
  { id: 'r1', name: 'הרב אברהם כהן', shiur: 'שיעור א׳' },
  { id: 'r2', name: 'הרב יצחק לוי', shiur: 'שיעור א׳' },
  { id: 'r3', name: 'הרב משה ישראלי', shiur: 'שיעור ב׳' },
  { id: 'r4', name: 'הרב דוד מזרחי', shiur: 'שיעור ב׳' },
  { id: 'r5', name: 'הרב יעקב בן דוד', shiur: 'שיעור ג׳' },
  { id: 'r6', name: 'הרב שמואל פרץ', shiur: 'שיעור ג׳' },
  { id: 'r7', name: 'הרב אליהו גולן', shiur: 'שיעור ד׳' },
  { id: 'r8', name: 'הרב נתן אזולאי', shiur: 'שיעור ד׳' },
];

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
  posts: [
    { id: 'p1', cat: 'אבידה', title: 'נמצאה כיפה שחורה', body: 'בבית המדרש ליד ארון 3', author: 'דני', ts: Date.now() - 3600e3 },
    { id: 'p2', cat: 'טרמפים', title: 'טרמפ לירושלים', body: 'יוצא ביום ה׳ ב-14:00, 3 מקומות פנויים', author: 'יוסי', ts: Date.now() - 7200e3 },
    { id: 'p3', cat: 'החלפת ספרים', title: 'מחליף משנה ברורה ח״ג', body: 'מחפש אורח חיים ח״ד', author: 'אורי', ts: Date.now() - 9000e3 },
  ],
  books: [
    { id: 'b1', title: 'ספר לדוגמה א׳', price: 60, sale: 45, note: 'מבצע השבוע' },
    { id: 'b2', title: 'ספר לדוגמה ב׳', price: 90, sale: null, note: 'חדש' },
  ],
  events: [
    { date: '2026-12-04', title: 'שבת ישיבה', kind: 'ישיבה' },
    { date: '2026-12-11', title: 'שבת חופשית', kind: 'חופשית' },
    { date: '2026-12-18', title: 'שבת ישיבה', kind: 'ישיבה' },
    { date: '2026-12-25', title: 'שבת חופשית', kind: 'חופשית' },
  ],
  parasha: { title: '', url: '', text: 'ממתין להעלאת דף פרשת השבוע מההנהלה.' },
  roshMsgs: [{ id: 'm1', title: 'שיחה לקראת השבת', body: 'כאן יופיעו דברי ראש הישיבה.', ts: Date.now() }],
  users: [
    { id: 'u0', name: 'מנהל', phone: '0544534345', email: '', role: 'admin', status: 'approved', rabbiId: null, shiur: null, shiurIdx: null, idHash: '', pwHash: 'ff2a789fb51fa47d789bf800682b03e4296d78f2936900c052df9fdae56d7209' },
  ],
  session: null,
};

// תוכן הכיתות מחולק לפי שיעורים: class_0 … class_3
export const classKey = (shiur) => 'class_' + Math.max(0, SHIURIM.indexOf(shiur));
SHIURIM.forEach((_, i) => { SEED['class_' + i] = []; });

const SHARED_KEYS = ['schedule', 'posts', 'books', 'events', 'parasha', 'roshMsgs', ...SHIURIM.map((_, i) => 'class_' + i)];
const cloud = {};
const notify = () => listeners.forEach((l) => l());

const read = (k) => {
  if (cloudEnabled) {
    if (k === 'users') return cloud.users || [];
    if (k in cloud) return cloud[k];
    return SEED[k];
  }
  const raw = localStorage.getItem(PREFIX + k);
  return raw === null ? SEED[k] : JSON.parse(raw);
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

export const uid = () => Math.random().toString(36).slice(2, 10);

// ---- משתמשים והתחברות ----
const pwHash = async (pw) => hashWith('sy-pw:', pw);
const hashWith = async (salt, s) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
};
export const hashId = (idNumber) => hashWith('sy-salt:', idNumber);

const PHONE_DOMAIN = '@phone.yeshiva.app';
const authEmail = (identifier) => (identifier.includes('@') ? identifier.trim().toLowerCase() : `${identifier.trim()}${PHONE_DOMAIN}`);

export const isRealEmail = (e) => Boolean(e) && !e.endsWith(PHONE_DOMAIN);

const buildProfile = async ({ name, phone, email, shiur, rabbiId, idNumber }) => ({
  name, phone, email: email || '', role: 'student', status: 'pending',
  rabbiId, shiur, shiurIdx: SHIURIM.indexOf(shiur), idHash: await hashId(idNumber),
});

export async function register(f) {
  const profile = await buildProfile(f);
  if (cloudEnabled) {
    cloud.registering = true;
    try {
      const id = await fb.signUpEmail(authEmail(f.email || f.phone), f.password);
      await fb.saveProfile(id, profile);
      if (isRealEmail(f.email)) await fb.sendVerify();
    } finally {
      cloud.registering = false;
      notify();
    }
    return;
  }
  const users = read('users');
  if (users.some((u) => u.phone === f.phone || (f.email && u.email === f.email))) throw new Error('exists');
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
  const id = identifier.trim().toLowerCase();
  const u = read('users').find((x) => (x.phone === id || x.email === id) && x.pwHash === h);
  if (!u) throw new Error('bad-credentials');
  set('session', u.id);
}

export function logout() {
  if (cloudEnabled) return fb.signOutCloud();
  set('session', null);
}

export function updateUser(id, patch) {
  if (cloudEnabled) return fb.saveProfile(id, patch);
  set('users', read('users').map((u) => (u.id === id ? { ...u, ...patch } : u)));
}
export function removeUser(id) {
  if (cloudEnabled) return fb.removeProfile(id);
  set('users', read('users').filter((u) => u.id !== id));
}

// מצב ענן: מאזינים לפי הרשאות המשתמש המחובר
if (cloudEnabled) {
  cloud.authReady = false;
  let unsubs = [];
  let unsubProfiles = null;
  let unsubMe = null;
  fb.onAuth((a) => {
    unsubMe?.(); unsubs.forEach((f) => f()); unsubProfiles?.();
    unsubMe = null; unsubs = []; unsubProfiles = null;
    cloud.me = null; cloud.users = [];
    cloud.authUser = a ? { uid: a.uid, email: a.email || '', emailVerified: a.emailVerified, name: a.displayName || '' } : null;
    if (!a) { cloud.authReady = true; return notify(); }
    unsubMe = fb.watchProfile(a.uid, (p) => {
      cloud.me = p;
      cloud.authReady = true;
      if (p?.status === 'approved' && !unsubs.length) {
        unsubs = SHARED_KEYS.map((k) => fb.watchKey(k, (v) => { cloud[k] = v; notify(); }));
      }
      const mgr = p?.status === 'approved' && ['rosh', 'admin'].includes(p.role);
      if (mgr && !unsubProfiles) unsubProfiles = fb.watchProfiles((l) => { cloud.users = l; notify(); });
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

export const isStaff = (u) => u && ['rabbi', 'rosh', 'admin'].includes(u.role);
export const isManager = (u) => u && ['rosh', 'admin'].includes(u.role);
