import { useState } from 'react';
import { useCurrentUser, logout } from './store.js';
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
import Admin from './pages/Admin.jsx';

export const SCREENS = {
  schedule: { title: 'סדר יום', icon: '🕒', C: Schedule },
  zmanim: { title: 'זמני היום', icon: '🌅', C: Zmanim },
  board: { title: 'לוח מודעות', icon: '📌', C: Board },
  books: { title: 'אוצר הספרים', icon: '📚', C: Books },
  calendar: { title: 'לוח שנה', icon: '📅', C: Calendar },
  parasha: { title: 'פרשת שבוע', icon: '📜', C: Parasha },
  classes: { title: 'הכיתה שלי', icon: '🎓', C: Classes },
  rosh: { title: 'ראש הישיבה', icon: '🕯️', C: Rosh },
  admin: { title: 'ניהול', icon: '⚙️', C: Admin, managerOnly: true },
};

export default function App() {
  const { user, ready, needsProfile, needsVerify, authUser } = useCurrentUser();
  const [screen, setScreen] = useState(null);

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

  const S = screen && SCREENS[screen];
  return (
    <div className="app">
      <header>
        {S ? <button className="back" onClick={() => setScreen(null)}>→</button> : <span />}
        <h2>{S ? S.title : 'ישיבת שדרות'}</h2>
        <button className="back" onClick={logout} title="יציאה">⎋</button>
      </header>
      <main>{S ? <S.C user={user} /> : <Home user={user} go={setScreen} />}</main>
    </div>
  );
}
