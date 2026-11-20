# חיבור Firebase (תוכנית Spark – חינמית)

1. ב-console.firebase.google.com: ליצור פרויקט (בלי Analytics).
2. Authentication ← Sign-in method ← להפעיל **Email/Password**. (משתמשים עם טלפון בלבד מקבלים מייל פנימי `טלפון@phone.yeshiva.app`.)
3. Firestore Database ← ליצור (מצב production), ואז להדביק את `firestore.rules` בלשונית Rules.
4. Project settings ← Web app ← להעתיק את הערכים ל-`.env` (לפי `.env.example`), ואז `npm run build`.
5. **מנהל ראשון:** להירשם באפליקציה, ואז ב-Firestore לערוך ידנית את המסמך `profiles/<uid>`: `role = "admin"`, `status = "approved"`.
6. להסיר את מנהל הדמו (`0500000000`) – הוא קיים רק במצב מקומי.

הערות: אין Firebase Storage (דורש תוכנית בתשלום), לכן דף הפרשה נשמר ב-Firestore עד 600KB.
כל מסמך ב-Firestore מוגבל ל-1MB, ולכן תוכן כל שיעור (`class_0…3`) מוגבל בגודלו; בהמשך כדאי לפצל לתת-מסמכים.

## תפקידים (עדכון)
- `owner` – מנהל ראשי; מנהל משנה (`admin`) לא יכול לשנות או למחוק אותו (נאכף בכללי האבטחה).
- כדי להפוך משתמש רשום למנהל: ב-Firebase Console ← Firestore ← `profiles/<uid>` ← שנה `role` ל-`owner`/`admin` ו-`status` ל-`approved`.
- רשימת השיעורים והרבנים נשמרת ב-`kv/classes` (גלויה גם לפני הרשמה), וטלפוני הרבנים ב-`kv/contacts`.
- תמונות אירועים: אוסף `photos` (תמונה אחת למסמך, דחוסה).

## אייקון ותמונת ראש הישיבה
- הלוגו: העלה ל-`assets/icon-only.png` במאגר – הבנייה תיצור ממנו את אייקון האפליקציה.
- תמונת ראש הישיבה: `public/rosh.jpg`, או החלפה מתוך האפליקציה (מסך ראש הישיבה, למנהל).
