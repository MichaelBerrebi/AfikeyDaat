# חיבור Firebase (תוכנית Spark – חינמית)

1. ב-console.firebase.google.com: ליצור פרויקט (בלי Analytics).
2. Authentication ← Sign-in method ← להפעיל **Email/Password**. (משתמשים עם טלפון בלבד מקבלים מייל פנימי `טלפון@phone.yeshiva.app`.)
3. Firestore Database ← ליצור (מצב production), ואז להדביק את `firestore.rules` בלשונית Rules.
4. Project settings ← Web app ← להעתיק את הערכים ל-`.env` (לפי `.env.example`), ואז `npm run build`.
5. **מנהל ראשון:** להירשם באפליקציה, ואז ב-Firestore לערוך ידנית את המסמך `profiles/<uid>`: `role = "admin"`, `status = "approved"`.
6. להסיר את מנהל הדמו (`0500000000`) – הוא קיים רק במצב מקומי.

הערות: אין Firebase Storage (דורש תוכנית בתשלום), לכן דף הפרשה נשמר ב-Firestore עד 600KB.
כל מסמך ב-Firestore מוגבל ל-1MB, ולכן תוכן כל שיעור (`class_0…3`) מוגבל בגודלו; בהמשך כדאי לפצל לתת-מסמכים.
