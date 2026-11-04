/**
 * Fuglekort: bekreftelse på e-post når noen setter seg på bestillingslisten.
 *
 * Ligger som Google Apps Script i kontoen post.fuglekort@gmail.com og er publisert som nettapp.
 * Supabase (Database Webhook på INSERT i forhandsbestillinger) sender hver ny påmelding hit,
 * og skriptet sender bekreftelsen fra Gmail-kontoen. Svar fra kunden havner i samme innboks.
 *
 * Oppsett: se README.md, «Bekreftelse på e-post».
 * HEMMELIG må være den samme koden som står bak ?hemmelig= i webhook-adressen i Supabase.
 * Ikke legg den ekte koden i dette repoet; det er offentlig.
 */
const HEMMELIG = 'SETT_INN_HEMMELIG_KODE';
const PRIS = 199, FRAKT = 69, MAL = 100;
const VILKAR = 'https://fuglekort.no/vilkar/';
const KONTAKT = 'post.fuglekort@gmail.com';

function doPost(e) {
  if (!e || !e.parameter || e.parameter.hemmelig !== HEMMELIG) return svar('nei');
  let data;
  try { data = JSON.parse(e.postData.contents); } catch (err) { return svar('ugyldig'); }
  if (!data || data.type !== 'INSERT' || data.table !== 'forhandsbestillinger' || !data.record) return svar('hoppet over');
  const r = data.record;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.epost || '')) return svar('ugyldig e-post');
  const cache = CacheService.getScriptCache();          // aldri to e-poster for samme påmelding
  if (r.id && cache.get(String(r.id))) return svar('sendt før');
  sendBekreftelse(r);
  if (r.id) cache.put(String(r.id), '1', 21600);
  return svar('sendt');
}

function sendBekreftelse(r) {
  const e = lagEpost(r);
  MailApp.sendEmail({ to: r.epost, subject: e.emne, body: e.tekst, htmlBody: e.html, name: 'Fuglekort', replyTo: KONTAKT });
}

/* Kjør denne i redigeringsverktøyet for å gi skriptet lov til å sende e-post og se hvordan bekreftelsen ser ut.
   Den sender en test til post.fuglekort@gmail.com. */
function testEpost() {
  sendBekreftelse({
    navn: 'Kari Nordmann', epost: KONTAKT, mobil: '91234567',
    antall_foto: 1, antall_illustrasjoner: 2, levering: 'post',
    adresse: 'Fuglevei 1', postnummer: '0880', poststed: 'Oslo',
  });
}

function lagEpost(r) {
  const foto = Number(r.antall_foto) || 0, ill = Number(r.antall_illustrasjoner) || 0;
  const post = r.levering === 'post', frakt = post ? FRAKT : 0, n = foto + ill;
  const fornavn = String(r.navn || '').trim().split(/\s+/)[0] || 'du';
  const linjer = [];
  if (foto) linjer.push(`${kortstokker(foto)} med ekte bilder: ${kr(foto * PRIS)}`);
  if (ill) linjer.push(`${kortstokker(ill)} med tegneseriefugler: ${kr(ill * PRIS)}`);
  const levering = post
    ? `Sendes i posten til ${r.adresse}, ${r.postnummer} ${r.poststed}. Frakt: ${kr(FRAKT)}`
    : 'Hentes i Oslo. Tid og sted avtaler vi på e-post';
  const pris = `${foto && ill ? 'Blir begge versjonene trykket' : 'Blir kortene trykket'}, er prisen ${kr(n * PRIS + frakt)}${post ? ' med frakt' : ''}.`;
  const videre = [
    'Du betaler ingenting nå.',
    `Hver versjon har sitt eget mål. Når en versjon har ${MAL} bestilte kortstokker, vurderer vi å trykke den.`,
    `Blir det trykk, får du en betalingsforespørsel i Vipps på ${mobil(r.mobil)} for det som trykkes. Du er ikke bundet før du har betalt.`,
    `${MAL} bestillinger er ingen garanti for at kortene blir trykket. Blir det ikke trykk, får du beskjed.`,
  ];
  const emne = 'Du står på listen for Fuglekort';
  const tekst = [
    `Hei ${fornavn},`, '',
    'Takk! Du står nå på bestillingslisten for Fuglekort.', '',
    'Dette har du meldt deg på:', ...linjer.map(l => `- ${l}`), `- ${levering}`, '',
    pris, '',
    'Slik går det videre:', ...videre.map(l => `- ${l}`), '',
    'Vil du endre noe eller melde deg av, svarer du bare på denne e-posten.', '',
    `Vilkår: ${VILKAR}`, '',
    'Hilsen', 'Fuglekort', 'Jakob Myking · org.nr. 938 664 641',
  ].join('\n');

  const li = l => `<li style="margin:0 0 6px">${esc(l)}</li>`;
  const html = `<!doctype html><html lang="nb"><body style="margin:0;background:#f6f3e9">
<div style="max-width:560px;margin:0 auto;padding:28px 20px;font:15px/1.6 Arial,Helvetica,sans-serif;color:#16343b">
<p style="font-size:22px;font-weight:800;letter-spacing:-1px;margin:0 0 22px">fuglekort<span style="color:#ce603a">.no</span></p>
<h1 style="font:400 28px/1.15 Georgia,'Times New Roman',serif;margin:0 0 16px">Du står på <em style="color:#ce603a">listen.</em></h1>
<p style="margin:0 0 18px">Hei ${esc(fornavn)}, takk! Du står nå på bestillingslisten for Fuglekort.</p>
<div style="background:#e9eddf;padding:16px 18px;margin:0 0 18px">
<p style="font-size:10px;letter-spacing:2px;font-weight:600;margin:0 0 8px">DETTE HAR DU MELDT DEG PÅ</p>
<ul style="margin:0;padding-left:20px">${linjer.map(li).join('')}${li(levering)}</ul>
<p style="margin:10px 0 0;font-weight:600">${esc(pris)}</p>
</div>
<p style="font-size:10px;letter-spacing:2px;font-weight:600;margin:0 0 8px">SLIK GÅR DET VIDERE</p>
<ul style="margin:0 0 18px;padding-left:20px;color:#4c5b54">${videre.map(li).join('')}</ul>
<p style="margin:0 0 18px">Vil du endre noe eller melde deg av, svarer du bare på denne e-posten.</p>
<p style="margin:0 0 24px"><a href="${VILKAR}" style="color:#16343b;font-weight:600;text-decoration:underline;text-decoration-color:#ce603a">Les vilkårene</a></p>
<p style="font-size:12px;color:#6d756a;margin:0;border-top:1px solid #dcded0;padding-top:14px">Fuglekort · Jakob Myking · org.nr. 938 664 641 · ${KONTAKT}</p>
</div></body></html>`;
  return { emne, tekst, html };
}

const kr = n => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} kr`;
const kortstokker = n => `${n} kortstokk${n === 1 ? '' : 'er'}`;
const mobil = m => String(m || '').replace(/^(\d{3})(\d{2})(\d{3})$/, '$1 $2 $3');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function svar(t) { return ContentService.createTextOutput(t); }
