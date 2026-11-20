import { initializeApp } from 'firebase/app';
import { getFirestore, doc, collection, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'firebase/auth';

// Firebase בתוכנית Spark (חינמית). בלי משתני VITE_FIREBASE_* האפליקציה עובדת מקומית בלבד.
const e = import.meta.env;
const cfg = {
  apiKey: e.VITE_FIREBASE_API_KEY,
  authDomain: e.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: e.VITE_FIREBASE_PROJECT_ID,
  appId: e.VITE_FIREBASE_APP_ID,
};

export const cloudEnabled = Boolean(cfg.apiKey && cfg.projectId);
const app = cloudEnabled ? initializeApp(cfg) : null;
const db = cloudEnabled ? getFirestore(app) : null;
const auth = cloudEnabled ? getAuth(app) : null;

const noop = () => {};
export const watchKey = (key, cb) => onSnapshot(doc(db, 'kv', key), (s) => s.exists() && cb(s.data().value), noop);
export const saveKey = (key, value) => setDoc(doc(db, 'kv', key), { value });

export const watchProfile = (uid, cb) =>
  onSnapshot(doc(db, 'profiles', uid), (s) => cb(s.exists() ? { id: uid, ...s.data() } : null), () => cb(null));
export const watchProfiles = (cb) =>
  onSnapshot(collection(db, 'profiles'), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), noop);
export const saveProfile = (id, data) => setDoc(doc(db, 'profiles', id), data, { merge: true });
export const removeProfile = (id) => deleteDoc(doc(db, 'profiles', id));

export const signUpEmail = (email, pw) => createUserWithEmailAndPassword(auth, email, pw).then((c) => c.user.uid);
export const signInEmail = (email, pw) => signInWithEmailAndPassword(auth, email, pw);
export const signOutCloud = () => signOut(auth);
export const onAuth = (cb) => onAuthStateChanged(auth, cb);
