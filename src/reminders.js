import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useStore } from './store.js';

const KEY = 'sy_reminders';
export const DEFAULT_REM = { on: false, mins: 10, cats: { tefilla: true, meal: false, seder: false, shiur: true, event: true } };
export const REM_CATS = { tefilla: 'תפילות', meal: 'ארוחות', seder: 'סדרי לימוד', shiur: 'שיעורים', event: 'אירועים (ביום האירוע)' };

export const loadRem = () => {
  try { return { ...DEFAULT_REM, ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return DEFAULT_REM; }
};
export const saveRem = (s) => {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event('sy-rem'));
};

export const classify = (title) => {
  if (/שיעור/.test(title)) return 'shiur';
  if (/תפיל|שחרית|מנחה|מעריב|ערבית/.test(title)) return 'tefilla';
  if (/ארוחת|ארוחה/.test(title)) return 'meal';
  if (/סדר|מוסר|בבלי|הלכה|גמרא|משנה/.test(title)) return 'seder';
  return null;
};

const isNative = () => Capacitor.isNativePlatform();

async function plugin() {
  return (await import('@capacitor/local-notifications')).LocalNotifications;
}

export async function ensurePermission() {
  if (!isNative()) return false;
  const LN = await plugin();
  const p = await LN.requestPermissions();
  return p.display === 'granted';
}

export async function testNotification() {
  if (!(await ensurePermission())) return false;
  const LN = await plugin();
  await LN.schedule({ notifications: [{ id: 1, title: 'אפיקי דעת', body: 'כך ייראו התזכורות', schedule: { at: new Date(Date.now() + 5000) } }] });
  return true;
}

export async function syncReminders(rem, schedule, scheduleFri, events) {
  if (!isNative()) return;
  const LN = await plugin();
  const pending = await LN.getPending();
  if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications.filter((n) => n.id !== 1) });
  if (!rem.on || !(await ensurePermission())) return;

  const list = [];
  let id = 100;
  const addWeekly = (items, weekdays) => items.forEach((s) => {
    const cat = classify(s.title);
    if (!cat || !rem.cats[cat]) return;
    const [h, m] = s.t.split(':').map(Number);
    const total = h * 60 + m - rem.mins;
    if (total < 0) return;
    weekdays.forEach((weekday) => list.push({
      id: id++,
      title: s.title,
      body: rem.mins ? `בעוד ${rem.mins} דקות (${s.t})` : s.t,
      schedule: { on: { weekday, hour: Math.floor(total / 60), minute: total % 60 }, allowWhileIdle: true },
    }));
  });
  addWeekly(schedule, [1, 2, 3, 4, 5]);
  addWeekly(scheduleFri, [6]);

  if (rem.cats.event) {
    const now = Date.now();
    events
      .filter((e) => e.kind === 'אירוע')
      .map((e) => ({ e, at: new Date(e.date + 'T08:00:00') }))
      .filter((x) => x.at.getTime() > now)
      .sort((a, b) => a.at - b.at)
      .slice(0, 20)
      .forEach(({ e, at }) => list.push({ id: id++, title: 'אירוע היום בישיבה', body: e.title, schedule: { at, allowWhileIdle: true } }));
  }
  if (list.length) await LN.schedule({ notifications: list });
}

export function useReminderSync(enabled) {
  const schedule = useStore('schedule');
  const fri = useStore('scheduleFri');
  const events = useStore('events');
  useEffect(() => {
    if (!enabled) return undefined;
    const run = () => syncReminders(loadRem(), schedule, fri, events).catch(() => {});
    run();
    window.addEventListener('sy-rem', run);
    return () => window.removeEventListener('sy-rem', run);
  }, [enabled, schedule, fri, events]);
}
