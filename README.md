# fuglekort_nettside

Nettstedet **https://fuglekort.no**, servert med GitHub Pages fra `main`, rot (`/`).

| Sti | Hva |
|---|---|
| `/` (`index.html`) | Forside med lenke til appen og personvernerklæringen |
| `/app/` | Play-versjonen av Hagefugler (Google Play, TWA med pakkenavnet `no.fuglekort.hagefugler`). **Lages av `build.py --play` i repoet fuglekort; ikke endre den her.** |
| `/personvern/` | Personvernerklæringen. Lenket fra appen og fra Play-oppføringen. `#slett` er siden Google krever for sletting. |
| `/.well-known/assetlinks.json` | Kobler domenet til Android-appen. Har SHA-256 for opplastingsnøkkelen fra PWABuilder; fingeravtrykket for «App signing key» fra Play Console → App integrity legges til når appen er lastet opp. Bare gyldige fingeravtrykk i lista. |
| `side.css` | Stilen til forsiden og personvernerklæringen (fontene fra `/app/fonts/`) |
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
