# אפיקי דעת – אפליקציית הישיבה

- פיתוח: `npm install && npm run dev` · בדיקות: `npm test`
- אפיון: `docs/SPEC.md` · חיבור Firebase: `docs/FIREBASE.md`

## בניית APK (חינם, GitHub Actions)
1. להעלות את הפרויקט ל-GitHub (מומלץ מאגר ציבורי – דקות בנייה חינמיות ללא הגבלה; במאגר פרטי יש מכסה חודשית).
2. Settings ← Secrets and variables ← Actions: להוסיף `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
3. Actions ← **Build APK** ← Run workflow. את `app-debug.apk` מורידים מה-Artifacts.

בלי הסודות האפליקציה תיבנה במצב מקומי (דמו) בלבד.
