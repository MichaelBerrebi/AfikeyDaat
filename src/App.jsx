import { useState, useEffect } from 'react';
import { hebrewDateLetters } from './hebcal.js';
import { useStore } from './store.js';
import { useReminderSync } from './reminders.js';
import Updater from './Updater.jsx';
import Reminders from './pages/Reminders.jsx';
import { useCurrentUser, logout, isProfileComplete, isManager } from './store.js';
import Auth from './Auth.jsx';
import { VerifyEmail, CompleteProfile } from './Gate.jsx';
import Home from './pages/Home.jsx';
import Schedule from './pages/Schedule.jsx';
import Zmanim from './pages/Zmanim.jsx';
import Board from './pages/Board.jsx';
import Books from './pages/Books.jsx';
import Calendar from './pages/Calendar.jsx';
import Parasha from './pages/Parasha.jsx';
import Classes from './pages/Classes.jsx';
import Rosh from './pages/Rosh.jsx';
import Profile from './pages/Profile.jsx';
import Events from './pages/Events.jsx';
import Admin from './pages/Admin.jsx';

export const SCREENS = {
  schedule: { title: 'סדר יום', icon: '🕒', C: Schedule },
  zmanim: { title: 'זמני היום', icon: '🌅', C: Zmanim },
  board: { title: 'לוח מודעות', icon: '📌', C: Board },
  books: { title: 'אוצר הספרים', icon: '📚', C: Books },
  calendar: { title: 'לוח שנה', icon: '📅', C: Calendar },
  parasha: { title: 'פרשת שבוע', icon: '📜', C: Parasha },
  classes: { title: 'הכיתה שלי', icon: '🎓', C: Classes },
  rosh: { title: 'לשכת ראש הישיבה', icon: 'ROSH', C: Rosh },
  profile: { title: 'פרופיל אישי', icon: '👤', C: Profile },
  events: { title: 'אירועים ותמונות', icon: '📷', C: Events },
  reminders: { title: 'תזכורות', icon: '🔔', C: Reminders },
  admin: { title: 'ניהול', icon: '⚙️', C: Admin, managerOnly: true },
};

// סדר הכפתורים במסך הבית (שתי עמודות)
export const HOME_ORDER = ['rosh', 'parasha', 'schedule', 'zmanim', 'classes', 'calendar', 'board', 'books', 'events', 'reminders'];

const dateFmt = new Intl.DateTimeFormat('he-IL', { weekday: 'long' });
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 15000); return () => clearInterval(i); }, []);
  return (
    <div className="clock">
      {dateFmt.format(now).replace('יום ', '')} {hebrewDateLetters(now)} · <b>{now.toTimeString().slice(0, 5)}</b>
    </div>
  );
}

export default function App() {
  const { user, ready, needsProfile, needsVerify, authUser } = useCurrentUser();
  const [screen, setScreen] = useState(null);
  const [menu, setMenu] = useState(false);
  const links = useStore('appLinks');
  useReminderSync(Boolean(user && user.status === 'approved'));

  // כפתור "חזור" של הטלפון: כל מסך נכנס להיסטוריה של הדפדפן
  useEffect(() => {
    history.replaceState({ s: null }, '');
    const onPop = (e) => setScreen(e.state?.s ?? null);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (s) => { history.pushState({ s }, ''); setScreen(s); };

  if (!ready) return <p className="hint" style={{ padding: 20 }}>טוען…</p>;
  if (needsVerify) return <VerifyEmail email={authUser.email} />;
  if (needsProfile) return <CompleteProfile authUser={authUser} />;
  if (!user) return <Auth />;
  if (user.status !== 'approved')
    return (
      <div className="auth">
        <h1>ממתין לאישור</h1>
        <p>הפרטים שלך נשלחו להנהלת הישיבה. תוכל להיכנס לאחר האישור.</p>
        <button onClick={logout}>יציאה</button>
      </div>
    );

  const mustComplete = !isProfileComplete(user);
  const S = mustComplete ? SCREENS.profile : screen && SCREENS[screen];
  return (
    <div className="app">
      <header>
        {S && !mustComplete && <button className="back" onClick={() => history.back()}>→</button>}
        <h2>{S ? S.title : <><img className="hdr-logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="" /> אפיקי דעת</>}</h2>
        <Clock />
        <span className="hbtns">
          <button className="gear" onClick={() => setMenu(!menu)} title="הגדרות">⚙️</button>
          <button className="back" onClick={logout} title="יציאה">⎋</button>
        </span>
        {menu && (
          <div className="menu">
            <button onClick={() => { setMenu(false); go('profile'); }}>👤 פרופיל אישי</button>
            {isManager(user) && <button onClick={() => { setMenu(false); go('admin'); }}>⚙️ ניהול</button>}
          </div>
        )}
      </header>
      <main>{!S && <Updater />}{S ? <S.C user={user} forced={mustComplete} /> : <Home user={user} go={go} />}</main>
      {links?.youtube && <a className="yt" href={links.youtube} target="_blank" rel="noreferrer">▶ ערוץ היוטיוב של אפיקי דעת</a>}
    </div>
  );
}
