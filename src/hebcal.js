const LAT = 31.5236, LON = 34.5953, TZ = 'Asia/Jerusalem'; // שדרות

const json = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
};

export const fmtDate = (d) => d.toISOString().slice(0, 10);

export async function getZmanim(date = new Date()) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 6e4);
  const j = await json(`https://www.hebcal.com/zmanim?cfg=json&latitude=${LAT}&longitude=${LON}&tzid=${TZ}&date=${fmtDate(d)}`);
  return j.times;
}

export async function getMonth(year, month) {
  const j = await json(
    `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on&s=on&mf=on&i=on&lg=he&year=${year}&month=${month}&geo=pos&latitude=${LAT}&longitude=${LON}&tzid=${TZ}`
  );
  return j.items;
}

export async function getParashaName() {
  const now = new Date();
  const items = await getMonth(now.getFullYear(), now.getMonth() + 1);
  const next = items.find((i) => i.category === 'parashat' && new Date(i.date) >= new Date(fmtDate(now)));
  return next ? next.hebrew : null;
}

export async function getDafYomi() {
  const items = await json(`https://www.hebcal.com/hebcal?v=1&cfg=json&F=on&lg=he&start=${fmtDate(new Date())}&end=${fmtDate(new Date())}`);
  return items.items?.[0]?.hebrew || null;
}

const hm = (iso) => iso.slice(11, 16);
const addMin = (iso, m) => {
  const [h, mi] = hm(iso).split(':').map(Number);
  const t = (h * 60 + mi + m + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

// הדלקת נרות, צאת שבת ורבנו תם (72 דקות אחרי השקיעה) לשבת הקרובה
export async function getShabbatTimes() {
  const j = await json(`https://www.hebcal.com/shabbat?cfg=json&latitude=${LAT}&longitude=${LON}&tzid=${TZ}&b=18&M=on&lg=he`);
  const candles = j.items.find((i) => i.category === 'candles');
  const havdalah = j.items.find((i) => i.category === 'havdalah');
  const parasha = j.items.find((i) => i.category === 'parashat');
  let rt = null;
  if (havdalah) {
    const z = await getZmanim(new Date(havdalah.date.slice(0, 10) + 'T12:00:00'));
    if (z.sunset) rt = addMin(z.sunset, 72);
  }
  return {
    parasha: parasha?.hebrew,
    candles: candles && hm(candles.date),
    havdalah: havdalah && hm(havdalah.date),
    rabbeinuTam: rt,
  };
}

const ONES = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
const TENS = ['', 'י', 'כ', 'ל'];
// תאריך עברי באותיות, למשל "י׳ כסלו"
export function hebrewDateLetters(d = new Date()) {
  const parts = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long' }).formatToParts(d);
  const day = parseInt(parts.find((p) => p.type === 'day').value, 10);
  const month = parts.find((p) => p.type === 'month').value;
  let s = day === 15 ? 'טו' : day === 16 ? 'טז' : TENS[Math.floor(day / 10)] + ONES[day % 10];
  s = s.length > 1 ? s.slice(0, -1) + '״' + s.slice(-1) : s + '׳';
  return `${s} ${month}`;
}
