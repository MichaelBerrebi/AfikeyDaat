import { useEffect, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

const ApkInstaller = registerPlugin('ApkInstaller');

const REPO = 'MichaelBerrebi/AfikeyDaat';
export const BUILD = Number(import.meta.env.VITE_APP_BUILD) || 0;

// בודק אם יש בגיטהאב גרסה חדשה יותר (התג v1.0.N) ומציע להוריד ולהתקין
export default function Updater() {
  const [rel, setRel] = useState(null);
  const [msg, setMsg] = useState('');
  const install = async () => {
    if (!Capacitor.isNativePlatform()) return window.open(rel.url, '_blank');
    setMsg('מוריד… (עשוי לקחת דקה)');
    try {
      await ApkInstaller.install({ url: rel.url });
      setMsg('');
    } catch (e) {
      setMsg(String(e?.message || e).includes('needs-permission')
        ? 'יש לאפשר "התקנת אפליקציות" לאפיקי דעת בהגדרות שנפתחו, ואז לחזור ולהקיש שוב.'
        : 'ההורדה נכשלה. נסה שוב.');
    }
  };
  useEffect(() => {
    if (!BUILD) return;
    fetch(`https://api.github.com/repos/${REPO}/releases/latest`)
      .then((r) => r.json())
      .then((j) => {
        const n = Number(String(j.tag_name || '').split('.').pop());
        const apk = (j.assets || []).find((a) => a.name.endsWith('.apk'));
        if (n > BUILD && apk) setRel({ n, url: apk.browser_download_url, tag: j.tag_name });
      })
      .catch(() => {});
  }, []);
  if (!rel) return null;
  return (
    <div className="card hl">
      <b>יש גרסה חדשה ({rel.tag})</b>
      <small>ההתקנה תתבצע על גבי הגרסה הקיימת, והנתונים יישמרו.</small>
      <button className="primary" onClick={install}>הורד והתקן</button>
      {msg && <small>{msg}</small>}
    </div>
  );
}
