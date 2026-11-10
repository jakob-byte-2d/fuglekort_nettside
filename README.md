# fuglekort_nettside

Nettstedet **https://fuglekort.no**, servert med GitHub Pages fra `main`, rot (`/`).

| Sti | Hva |
|---|---|
| `/` (`index.html`, `style.css`, `app.js`, `fuglekort-box.js`, `assets/`) | Hjemmesiden: 3D-esken, fem smakebitkort, kilder, appen, personvern og bestillingslisten (dialogen «Sett deg på listen»). `embed.html` viser bare esken (til iframe). |
| `assets/google-play-nb-NO.svg` | Googles norske merke «Last ned på Google Play» med lenke til appen i Play-butikken (https://play.google.com/store/apps/details?id=no.fuglekort.hagefugler). Fra Googles merkeside (play.google.com/intl/en_us/badges), som SVG fra [pioug/google-play-badges](https://github.com/pioug/google-play-badges) (synket februar 2026). Brukes uendret; Google krever linjen «Google Play og Google Play-logoen er varemerker for Google LLC.» under. Ved siden av står «For iPhone» (veiledningen for Hjem-skjermen). `app.js` viser det som passer: iPhone ser bare «For iPhone», Android-telefoner bare merket, PC og nettbrett begge. |
| `/app/` | Play-versjonen av Hagefugler (Google Play, TWA med pakkenavnet `no.fuglekort.hagefugler`). **Lages av `build.py --play` i repoet fuglekort; ikke endre den her.** |
| `/personvern/` | Personvernerklæringen for appen og bestillingslisten. Lenket fra appen og fra Play-oppføringen. `#slett` er siden Google krever for sletting, `#bestillingslisten` er delen om lista. |
| `/vilkar/` | Vilkårene for bestillingslisten: pris, frakt, ingen garanti for trykk, Vipps, angrerett og selgeropplysninger. |
| `google-apps-script/bekreftelse.gs` | Skriptet som sender bekreftelsen på e-post fra post.fuglekort@gmail.com. Ligger som Google Apps Script i den kontoen; denne kopien har ikke den hemmelige koden. |
| `supabase/forhandsbestillinger.sql` | Tabellen, tilgangsreglene, telleren og Vipps-lista for bestillingslisten. Kjøres i Supabase-prosjektet til appen. |
| `/.well-known/assetlinks.json` | Kobler domenet til Android-appen. Har SHA-256 for opplastingsnøkkelen fra PWABuilder og de tre fra Play Console → Appsignering → «Kopier alle sertifikatfingeravtrykk» (appsigneringsnøklene til Google). Mangler Googles nøkkel, viser appen en adresselinje øverst. Bare gyldige fingeravtrykk i lista. |
| `side.css` | Stilen til personvernerklæringen og vilkårene, i samme stil som hjemmesiden (bare systemfonter) |
| `CNAME` | `fuglekort.no` |
| `.nojekyll` | Uten den publiserer ikke Pages mappen `.well-known` |

## Oppdatere appen

I repoet fuglekort (ved siden av dette):

    python3 build.py
    python3 build.py --play ../fuglekort_nettside/app
    python3 tests/play_test.py ../fuglekort_nettside

Så commit og push her. Den gamle nettversjonen på jakob-byte-2d.github.io/fuglekort/ publiseres fra repoet fuglekort som før.

## Domenet

Domenet ligger på dette repoet, ikke på fuglekort-repoet: får et prosjektrepo eget domene, sender GitHub den gamle github.io-adressen videre dit, og brukerne mister dataene sine (de lagres per adresse). Lag heller ikke et `jakob-byte-2d.github.io`-repo med domene; da flytter alle prosjektsidene under det domenet.

DNS hos registraren: A-poster for `@` til 185.199.108.153, 185.199.109.153, 185.199.110.153 og 185.199.111.153, AAAA-poster til 2606:50c0:8000::153, 2606:50c0:8001::153, 2606:50c0:8002::153 og 2606:50c0:8003::153, CNAME `www` → `jakob-byte-2d.github.io.`, og TXT-posten for verifisering (`_github-pages-challenge-jakob-byte-2d`). Ingen wildcard.

## Bestillingslisten

Folk setter seg på listen i bestillingsdialogen på forsiden uten å betale. Pris, frakt og mål står øverst i den nye delen av `app.js` (`PRICE`, `SHIPPING`, `GOAL`, `MAX`) og i vilkårene og SQL-fila (visningen `vipps_krav`). Endrer du dem, endrer du alle tre stedene.

- **Oppsett:** Supabase → SQL Editor → lim inn `supabase/forhandsbestillinger.sql` → Run. Må gjøres før endringen publiseres, ellers virker ikke skjemaet. Fila kan kjøres på nytt, og flytter påmeldinger fra den første versjonen (ett antall og én versjon) over til antall per versjon.
- **Se lista:** Supabase → Table Editor → `vipps_krav`. Viser navn, mobil, antall av hver versjon, levering, beløp per versjon (antall × 199 kr), frakt (69 kr ved post), `belop_begge` og adresse.
- **Mål:** 100 kortstokker per versjon. Én påmelding kan ha begge versjonene, opptil 20 av hver.
- **Vipps-krav:** send betalingsforespørsel fra Vipps' bedriftsportal til mobilnummeret. Blir begge versjonene trykket, bruk `belop_begge`. Blir bare én trykket, bruk beløpet for den versjonen + `frakt`.
- **Status:** endre `status` i tabellen `forhandsbestillinger` til `betalt`, `sendt` eller `trukket`. Trukne påmeldinger telles ikke med.
- **Sletting:** påmeldinger som ikke er trykket etter 12 måneder skal slettes, og alt slettes hvis det ikke blir trykk. SQL-en står nederst i fila.
- **Nettsiden** kan bare legge inn påmeldinger og hente telleren. Navn, e-post, mobil og adresse kan ikke leses derfra.

## Bekreftelse på e-post

Hver ny påmelding får en bekreftelse fra post.fuglekort@gmail.com. Supabase sender påmeldingen til et Google Apps Script i den kontoen, og skriptet sender e-posten med Gmail (høyst 100 mottakere per dag).

1. **Skriptet:** logget inn som post.fuglekort@gmail.com → script.google.com → Nytt prosjekt → lim inn `google-apps-script/bekreftelse.gs` → sett `HEMMELIG` til en lang, tilfeldig kode → lagre.
2. **Tillatelse og test:** velg `testEpost` i funksjonslisten → Kjør → gi tillatelse. En testbekreftelse kommer til post.fuglekort@gmail.com.
3. **Publiser:** Distribuer → Ny distribusjon → Nettapp → Kjør som: meg → Hvem har tilgang: Alle → Distribuer. Kopier adressen som slutter på `/exec`.
4. **Webhook i Supabase:** Database → Webhooks → ny webhook på tabellen `forhandsbestillinger`, hendelse Insert, HTTP Request, POST til `<adressen>?hemmelig=<koden>`, tidsavbrudd 5000 ms.

Endrer du skriptet senere: Distribuer → Administrer distribusjoner → rediger → Ny versjon. Da beholder du samme adresse.
