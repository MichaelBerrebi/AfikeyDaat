import { useEffect, useState } from 'react';

const REPO = 'MichaelBerrebi/AfikeyDaat';
export const BUILD = Number(import.meta.env.VITE_APP_BUILD) || 0;

// בודק אם יש בגיטהאב גרסה חדשה יותר (התג v1.0.N) ומציע להוריד ולהתקין
export default function Updater() {
  const [rel, setRel] = useState(null);
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
      <small>לחץ להורדה, ואחר כך לחץ על הקובץ שירד כדי להתקין (ייתכן שתתבקש לאשר התקנה מהדפדפן).</small>
      <button className="primary" onClick={() => window.open(rel.url, '_system')}>הורד והתקן</button>
    </div>
  );
}
