# diku. – React frontend

Magyar nyelvű digitális kultúra emelt érettségi felkészítő, publikus tájékoztató oldalakkal, jelentkezési űrlappal, tanulói és adminisztrációs felülettel. Az alkalmazás helyben futtatható, és a Rackforest VPS-en, Cloudflare Tunnelen keresztül élesben is elérhető. Az automatizálás és ellenőrzéseinek irányadó, folyamatosan frissített állapota: [DEPLOY-STATUS](../database/docs/DEPLOY-STATUS.md).

## Indítás

Node.js 24 LTS és npm szükséges. Az API alapértelmezetten a `http://127.0.0.1:8080` címen fut. Az adatbázis és a backend indítását a szomszédos `database` repository dokumentálja.

```sh
npm ci
npm run dev
```

Frontend: `http://127.0.0.1:5173`. A `/api` kéréseket Vite a backendnek továbbítja, a böngésző azonos eredetű session cookie-t használ. A frontend önmagában is megjeleníti az összes publikus oldalt; backend nélkül az adatküldés és belépés valós hibát jelez, nem szimulál sikeres műveletet.

```sh
npm run build
npm test
npm run preview
```

A build TypeScript ellenőrzést, kliensbuildet és szerveroldali előrenderelést végez. A `dist/` önállóan kiszolgálható Nginx által. A `preview` Vite szerver csak fejlesztői ellenőrzésre szolgál; az éles 404/átirányítás/headerek ellenőrzésére a Docker image szükséges.

## Egységes ármegjelenítés – 2026. október 27.

Az Árak oldal, a `/kurzusok` és `/jelentkezes` kurzuskártyái, az űrlap élő díjösszesítője, a sikeres beküldés visszajelzése és az admin jelentkezésrészlete közös `src/PriceDisplay.tsx` komponenst használ. `DiscountBadge`: piros százalékjelzés; `PriceDisplay`: áthúzott alapdíj, nagy piros végösszeg, megtakarítás és tanóradíj. Közös stílus: `src/price-display.css`; oldalelrendezés: `pricing.css`, kurzus/űrlapkeret: `portal.css`. Új árblokkhoz ezt használd, ne másold le a markupot. A kurzuskártyákon az ár az időpont alatt, a részletes adatok előtt szerepel.

A komponens kapott összegeket jelenít meg, nem határoz meg kedvezményszabályt. Teljes áron nincs áthúzás, nulla kedvezményjelzés vagy megtakarítás. Mentett díjhoz kizárólag az adott rekord értékei használhatók; a publikus beküldési válasz nem tartalmaz alapdíjat, ezért ott nem találunk ki eredeti árat/megtakarítást. A végösszeg, tanóradíj és a visszakapott százalék így is kiemelt. A baráti előkalkuláció és a backend 35%-os plafonja, API, űrlapengedélyezés és adatok változatlanok. Az admin listanézet tömör marad, a megnyitott rekord használja a közös árblokk kompakt változatát.

Igazolt: TypeScript/kliens/SSR build, 18 útvonal + 404, 9/9 teszt (6 SEO + 3 ármegjelenítési regresszió). Valódi helyi API-val két csoport, csoportválasztás, 0/1/2/10 barát: 210/196/182/182 ezer Ft; 35%-os plafon. Kurzus és űrlap 390/320 px, Árak 820/320 px, asztali nézet kilógás és konzolhiba nélkül. Nem küldtünk be jelentkezést; a visszajelzést és történeti díjakat komponensszintű teszt ellenőrzi. A helyi preview aloldalait záró perjellel nyisd meg (`/kurzusok/`, `/jelentkezes/`, `/arak/`), hogy az előrenderelt HTML töltődjön be.

## Útvonalak és tartalom

Publikus: `/`, `/kurzusok`, `/jelentkezes`, `/szuloknek`, `/diakoknak`, `/erettsegi-feladatsorok`, `/programozas-izelito`, `/oktatas-menete`, `/oktatok`, `/arak`, `/gyik`, `/helyszin`, `/kapcsolat`, `/adatkezeles`, `/impresszum`.

Belépés: `/belepes`. Tanuló: `/tanulo`. Adminisztrátor: `/admin`.

`src/App.tsx`: publikus oldalak és a közös keret. `src/ExamResources.tsx` + `src/examSources.ts`: az Oktatási Hivatal ellenőrzött, eredeti feladat- és megoldáslinkjei. `src/Portal.tsx`: jelentkezés, belépés, tanulói felület, admin panelek. `src/api.ts`: session/CSRF kliens. `src/seo.ts`: útvonal, cím, leírás, canonical és strukturált adatok. `src/styles.css`: reszponzív arculat. `src/fonts.css`: helyben kiszolgált Latin/Latin Extended betűkészletek (DM Sans és Manrope; SIL OFL, licencek a public/licenses könyvtárban, a build ezeket is kiszolgálja).

A 2026. október 21-ig megadott üzleti tények szerepelnek: 80 tanóra / 20 alkalom / 4 × 45 perc, 2027. január 9-i kezdés, szombati 9–13 és 14–18 idősáv, legfeljebb 24 fő, két oktató (Balázs és Peti), Gábor Dénes Egyetem a XI. kerületben. A pontos terem, szoftverek, fizetési/lemondási és laptopbérlési feltételek továbbra is jelölt helyőrzők. Nincs kitalált portré, sikermutató vagy ügyfélvélemény. Az admin nem tartalomkezelő CMS: a marketingoldalak szövegei jelenleg forráskódban szerkeszthetők.

## Valós működés

- Jelentkezés beküldése; kötelező mezők, hozzájárulási checkbox, függő/sikeres/hibás állapotok.
- Session bejelentkezés; CSRF token a módosító kérésekhez, újraigénylés belépés/kilépés után. Jogosultságot mindig a backend ellenőriz.
- Admin: jelentkezések szűrése, keresése, státusza és belső megjegyzése; felhasználó létrehozása/szerkesztése, szerepkör, tiltás, jelszó; órák létrehozása/szerkesztése, időpont, HTTPS értekezletlink, publikálás; fájl feltöltés/letöltés/törlés; eseménynapló.
- Tanuló: közzétett órák és tananyagok, fájlletöltés, HTTPS értekezlet csatlakozás. A diákoknak nincs önregisztráció, az admin hozza létre a fiókokat.
- Az órák időpontjai budapesti falióraként érkeznek (`LocalDateTime`), az audit/jelentkezés dátumai abszolút időpontok (`Instant`). A megjelenítés ezt külön kezeli, független a néző készülékének időzónájától.

A helyi fejlesztői backend alapfiókjai (csak local profil): `admin@diku.local` / `DikuAdmin2026!`, `diak@diku.local` / `DikuDiak2026!`. Ezeket a felület nem jeleníti meg, az éles környezetbe nem kerülhetnek.

## Jelentkezési űrlap kapcsoló

Fejlesztői módban a jelentkezés engedélyezett, és tesztadatokra figyelmeztet. Production buildben alapból a beküldés nem aktív: `VITE_APPLICATIONS_ENABLED=false`. Helyi Compose ezt explicit `true` értékkel buildeli, hogy az egész folyamat tesztelhető legyen.

Éles engedélyezés előtt véglegesíteni kell az adatkezelési tájékoztatót és a szolgáltatói adatokat. A GitHub repository `APPLICATIONS_ENABLED` változóját `true` értékre állítva a következő `main` image build engedélyezi az űrlapot. Docker kézi buildnél `--build-arg VITE_APPLICATIONS_ENABLED=true`. Ez kizárólag felületi ki-/bekapcsolás, nem a nyilvános API biztonsági tiltása.

## SEO és teljesítmény

A 2026. október 21-i publikus változat 18 ismert útvonalat és a 404 oldalt rendereli. A fő CTA a `/kurzusok`, külön szülői és diák tájékoztató oldal készült. Az érettségi archívum 5 vizsgaidőszak 20 eredeti OH PDF/ZIP hivatkozását adja; a forrás és az ellenőrzés dátuma látható. A fájlokat nem tükrözzük és nem módosítjuk.

Az `/arak` oldal statikus, buildkor olvasható ártáblája: 3 500 Ft/tanóra, 280 000 Ft alapdíj; 25% korai kedvezmény 2026. november 15-ig, 15% december 15-ig. A korai és baráti százalékok összeadódnak, maximum 35%-ig, mindig az alapdíjból. A baráti jogosultságot admin ellenőrzi. Példák: 25+5%=196 000 Ft; 25+10%=182 000 Ft; 15+5%=224 000 Ft. A kurzuskártyák és a jelentkezési árbecslés a backend adatait használják, a végleges díjat a szervezők igazolják vissza.

2026. október 26.: az Árak oldal elején a kedvezmények szerepelnek. Piros kiemelés, áthúzott alapdíj, nagy 210 000 Ft-os ár és 70 000 Ft megtakarítás mutatja a 25%-os Super Early Bird ajánlatot. Mellette az akár 35%-os, 182 000 Ft-os példa közvetlenül jelzi a november 15-i határidőt és két hozott barát feltételét. A 15%-os Early Bird külön, november 16. – december 15. közötti sávként látható. A tanóradíjak, összevonási példák, 35%-os plafon és admin-visszaigazolás megmaradtak. Megvalósítás: `src/App.tsx` Pricing komponens, elkülönített `src/pricing.css`; nincs új függőség vagy időpontfüggő renderelés. A feltüntetett dátumok statikusak: új kampánynál a szöveget és a backend szabályait együtt kell felülvizsgálni.

Ellenőrzés: TypeScript/kliens/SSR build és 18 oldal + 404 előrenderelése, 6/6 SEO-teszt sikeres. Asztali, 820, 390 és 320 px nézetben az oldal/kártyák vízszintes kilógás nélkül; a részletek horgonyhivatkozása és a kurzusokra mutató fő CTA működik. A Vite preview alatt a `/arak/` könyvtárútvonal szolgálja ki a helyes előrenderelt HTML-t; a `/arak` SPA-fallback itt téves kezdőlapi HTML-t és hidratálási hibát okozhat. Ez a fejlesztői preview korlátja, az éles Nginx saját útvonalszabályokat használ. A helyi Docker Engine lekérdezése 500 hibát adott, ezért a helyi konténert nem építettük újra; a kész frontend build külön, `http://127.0.0.1:4173/arak/` címen ellenőrzött. A helyes előrenderelt útvonal végleges betöltésekor nem volt új konzolhiba.

A kezdőlapi programozási ízelítő űrlap érdeklődést rögzít. A szervező manuálisan küldi a linket és kezeli az állapotot; nincs automatikus SMTP/levélküldés. A noindex `/programozas-izelito` opcionális, rövid, statikus Python-oktatópélda: a válaszgomb előre megírt eredményt jelenít meg, nincs kódfuttatás, felhasználói kód vagy eval.

Minden ismert útvonal teljes HTML törzzsel, egyetlen H1-gyel és egyedi title/description/canonical tagekkel épül. Open Graph, magyar nyelvkód, `WebSite`/`BreadcrumbList` JSON-LD, automatikus sitemap és robots fájl. A canonical host `https://diku-erettsegi.hu`, az aloldalak URL-je záró perjel nélküli.

A jogi piszkozatok, a programozási ízelítő, a belépés, admin és tanulói felület `noindex` jelölést kapnak, a sitemapből kimaradnak. A robots engedi e shelloldalak beolvasását, hogy a robot lássa a `noindex` jelölést; a `/api/` tiltott. Az ismeretlen URL Nginx alatt valódi 404 választ ad, nem SPA fallbacket. Nincsenek eredményígéretek, értékelések vagy hamis `LocalBusiness` adatok a strukturált adatokban.

Nincs analitika, hirdetés, külső iframe, külső betűkészletkérés vagy felhasználói követés. Helyi, optimalizált és kreditelt Pexels-stockfotók (egyértelműen illusztrációként jelölve), rendszeres fallback, helyi WOFF2 betűk, gzip és hosszú ideig cache-elhető hash-elt assetek. A kis animáció tiszteletben tartja a `prefers-reduced-motion` beállítást. Formoknál valódi label, fókuszjelölés, státusz/híbaüzenet, skip link, mobil menü. JavaScript nélkül a tájékoztató tartalom látható; adatküldés/belépés JavaScriptet igényel. A formok `method="post"` beállítása megakadályozza a hitelesítő adatok URL-be kerülését sikertelen hidratáláskor.

## Konténer és szállítás

Többlépcsős Dockerfile: Node build → Nginx, `/healthz` healthcheck, `/api` proxy a `backend:8080` címre. A frontend nem közvetlenül kommunikál MariaDB-vel. Az API és auth shell válaszok no-store cache szabályt kapnak. CSP, nosniff, frame tiltás és referrer policy aktív.

A `main` push CI ellenőrzés után a `ghcr.io/diku-erettsegi/frontend:main` és a teljes commit SHA taggel publikál image-et. PR esetén csak ellenőrzés fut. A live szerver pull/frissítés mechanizmusa az infrastruktúra repository feladata; a workflow nem deployol saját maga VPS-re.

Az első GitHub CI és image-publikálás sikeres. A VPS-en a frontend, backend, MariaDB és cloudflared konténere is **healthy**, a `diku-deploy` felhasználó anonim GHCR image-letöltése működik. A Cloudflare-zóna későbbi névszerverváltásra vár. A `main` push → image-publikálás → szerveroldali timer → frissült alkalmazás folyamat, valamint a belépés/CSRF, mentés és további üzemeltetési próbák aktuális eredményeit a [telepítési állapot](../database/docs/DEPLOY-STATUS.md) rögzíti. A belső VPS-próba nem helyettesíti a későbbi publikus HTTPS-ellenőrzést.

Fontos hálózati szerződés: élesben csak a Cloudflare Tunnel érheti el az Nginxet, publikus frontend/backend hostport nem nyitható. Az Nginx a megbízható tunnel `CF-Connecting-IP` értékéből állítja az `X-Forwarded-For` címet, és átengedi a tunnel HTTPS protokolljelzését. A helyi fallback a közvetlen kapcsolat címe. Publikus közvetlen elérés esetén ezeket a proxyheadereket újra kell tervezni, mert a kliens hamisíthatná őket.

A backend felé csak az Nginx által beállított `X-Forwarded-For`, `X-Forwarded-Host` és `X-Forwarded-Proto` értékek maradnak meg. A kliens `Forwarded`, `X-Forwarded-Port`, `X-Forwarded-Prefix` és `X-Forwarded-Ssl` fejléceit töröljük: a Spring forwarded-header feldolgozó ezeket is értelmezné, így különben felülírhatnák a megbízható klienscímet, protokollt vagy URL-t. A Cloudflare fejléc bizalma kizárólag a tunnelből elérhető éles originre érvényes.

`npm run test:proxy`: Dockerrel végzett célzott regressziós teszt, előzetesen elkészített `dist/` könyvtárral. Külön, egyedi nevű Docker-hálózatot és két tesztkonténert indít, majd eltávolítja őket; a futó helyi alkalmazást nem módosítja. Valódi Nginxen ellenőrzi a konfigurációt, a hamis forwarding fejlécek eltávolítását, a cookie/CSRF/POST törzs/query megőrzését, a localhost fallbacket, a relatív átirányítást és a valódi404-et. A frontend CI `verify` feladatában az image-publikálás előtt fut. Docker Engine, a Node24 és Nginx1.28 image-ek elérése szükséges hozzá.

## Tesztek és nyitott feladatok

`npm run build` ellenőrzi a típusokat és generálja a végleges oldalakat. `npm test` a buildelt HTML-en ellenőrzi a H1/title/canonical/meta adatokat, a noindex/sitemap elválasztást és a kitalált SEO-adatok hiányát. A teljes alkalmazás API-integrációját és az auth/session jogosultságokat a backend tesztjei és a helyi teljes rendszer ellenőrzése fedi.

Indulás előtt: végleges jogi szöveg, tényleges telefonszám, pontos terem, a 20 alkalom teljes dátumlistája, laptopbérlés és fizetési feltételek, éles fiókok, jelszókezelés/elfelejtett jelszó folyamat, éles cookie/Tunnel/backup ellenőrzés. Nyitott: nincs automatikus e-mail, jelszó-visszaállítás, online fizetés, jelenléti ív, tanulócsoport-hozzárendelés vagy marketing CMS; minden közzétett órát minden aktív tanuló lát.
