const ROWS = [
  ['כתובת', 'רח׳ זרח משה 923, ת.ד. 52, שדרות 80010'],
  ['טלפון', '08-6611-360', 'tel:086611360'],
  ['פקס', '08-661-0814'],
  ['דואר אלקטרוני', 'lapid@goldmail.net.il', 'mailto:lapid@goldmail.net.il'],
  ['ראש הישיבה', 'הרב דוד פנדל'],
  ['אחראי שבוע ישיבה', 'דביר מסאמי · 050-2103353', 'tel:0502103353'],
  ['אתר', 'www.sderot.org/g', 'http://www.sderot.org/g'],
];
export default function Contact() {
  return (
    <>
      {ROWS.map(([k, v, href]) => (
        <div className="card row" key={k}>
          <small>{k}</small>
          {href ? <a href={href} target="_blank" rel="noreferrer">{v}</a> : <b>{v}</b>}
        </div>
      ))}
      <a className="primary-link" href="https://maps.google.com/?q=ישיבת+ההסדר+שדרות" target="_blank" rel="noreferrer">📍 ניווט לישיבה</a>
    </>
  );
}
