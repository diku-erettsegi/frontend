# Átadás – frissítve 2026. október 24.

## Aktuális telepítési állapot

Az első teljes Rackforest VPS-telepítés sikeres: a frontend, backend, MariaDB és cloudflared konténere egyaránt **healthy**. Az első GitHub main push és CI image-publikálás megtörtént, a `diku-deploy` felhasználó anonim GHCR image-letöltése ellenőrzött.

A Cloudflare-zóna későbbi névszerverváltásra vár: a felhasználó ezt most kifejezetten kihagyta a feladatból. A publikus domain/HTTPS működésének ellenőrzése ezért későbbi lépés. A `main` push → CI → GHCR → szerveroldali timer → alkalmazásfrissítés ciklus, a production auth- és mentési próbák állapotát, a timerek aktiválását és minden új eredményt a **[database/docs/DEPLOY-STATUS.md](../database/docs/DEPLOY-STATUS.md)** tart nyilván; ez az irányadó élő állapot. Az alábbi korábbi ellenőrzések történeti pillanatképek.

## Production proxy ellenőrzés – október 22.

A Cloudflare Tunnel mögötti Spring `framework` feldolgozás miatt az Nginx API proxy most törli a kliens RFC `Forwarded`, `X-Forwarded-Port`, `X-Forwarded-Prefix` és `X-Forwarded-Ssl` fejléceit. Csak a saját, megbízható forrásból képzett X-Forwarded-For/Host/Proto értékeket továbbítja. Ez megakadályozza, hogy alternatív fejléccel felülírják a Spring által látott címet/protokollt és az IP-alapú korlátozás alapját.

Új regresszió: `tests/proxy.test.mjs`, futtatás `npm run test:proxy`. Izolált Docker-hálózaton valódi Nginx és egyszerű HTTP echo backend ellenőrzi a fejlécszűrést és a normál proxy/HTML útvonalakat. A frontend CI-ben a `verify` része, tehát siker nélkül nem publikál `main` image-et. A backend workflow változatlan: main-only publikálás, `needs: verify`, GHCR packages:write és main+commit SHA tagek megfelelőek. Ebben az október 22-i ellenőrzési körben production VPS-módosítás és push még nem történt.

Ellenőrizve: `npm run test:proxy` sikeres. A teszt részeként `nginx -t` is sikeres; a hamis forwarding fejlécek eltűnnek, a megbízható klienscím/host/HTTPS és a cookie/CSRF/POST/query továbbítása megmarad. A 200/relatív301/valódi404/no-store vizsgálatok sikeresek. A tesztkonténerek és -hálózat takarítása ellenőrizve. A root ezután október 22-én újraépítette és egészségesen elindította a helyi frontend konténert: a Docker buildben a TypeScript/prerender és a 6/6 SEO teszt is sikeres. Backendteszt-ismétlés és alkalmazásadat-módosítás ebben a deploy-előkészítésben nem történt.

## Publikus oldal újratervezése

Barátságos, fotós krém/zöld megjelenés, a személyes tantermi felkészülés hangsúlyával. Saját kiszolgálású, optimalizált Pexels-stockfotók, kredit és egyértelmű illusztrációjelölés. Az oktatói portrék továbbra is jelölt helyőrzők. Nincs AI-kép a publikus oldalakon.

Fő útvonal `/kurzusok`, új oldalak `/szuloknek`, `/diakoknak`, `/erettsegi-feladatsorok`, `/programozas-izelito`. A korábbi `/jelentkezes` működő alternatív belépő a kurzusválasztáshoz. Összesen 18 előrenderelt útvonal +404, egyedi title/description/canonical/H1, kibővített Nginx 301/404 útvonalak.

Rögzített üzleti adatok: 80 tanóra / 20 alkalom / 4×45 perc; 2027. január 9-i kezdés; szombati 9–13 vagy 14–18 idősáv, szünetekkel; két oktató és legfeljebb 24 diák; Gábor Dénes Egyetem, XI. kerület/Bikás park közelében. Balázs 20 év szoftverfejlesztői és felnőttoktatási tapasztalata; Peti egyetemi tanulmányai és 4 év kiscsoportos korrepetálása a megadott adatok alapján szerepel.

Árak: 280 000 Ft alapdíj; 25% korai kedvezmény november 15-ig = 210 000 Ft; 15% december 15-ig = 238 000 Ft. Baráti+korai kedvezmények összeadhatók maximum 35%-ig, alapdíjra számítva. Példák:30% = 196 000 Ft,35% = 182 000 Ft,20% = 224 000 Ft. Jogosultság és végleges díj admin által visszaigazolva. Korábbi „összevonás pontosítás alatt” szöveg eltávolítva.

Programozási érdeklődés: manuális küldési folyamat; nincs automatikus e-mail ígéret. A mintafeladat-oldal opcionális noindex tananyag, nem futtat Python-kódot. Az OH archívum 5 időszak 20 ellenőrzött eredeti PDF/ZIP linkjét tartalmazza, a dokumentumok nem tükrözöttek.

A hiányzó tényleges telefonszám továbbra is jól jelzett, nem kattintható helyőrző. Az adatkezelés, impresszum, pontos terem, részletes órarend, laptopbérlés, fizetési/lemondási feltételek még véglegesítendők. Az `info@diku-erettsegi.hu` a megadott kapcsolati cím; a postaláda működését a frontend nem igazolja.

Helyi ellenőrzés az új változaton: `npm run build` sikeres (TypeScript, kliensbuild, SSR és 18 útvonal előrenderelése), `npm test` 6/6 sikeres, `git diff --check` tiszta. A tesztek a H1/meta/canonical egyediséget, a noindex oldalak kizárását, a jóváhagyott ártábla és kurzustények szerveroldali jelenlétét, a 20 hivatalos vizsgafájl-hivatkozást és a helyi kreditelt stockfotókat ellenőrzik. JavaScript ~92 KB gzip, CSS ~12 KB gzip; a két fő fotó együtt ~128 KB. A teljes rendszer és a böngészőben végzett ellenőrzés eredménye a szomszédos `database/docs/HANDOFF.md` fájlba kerül.

## Előző alapimplementáció

Első teljes frontend implementáció, üres repositoryból. Publikus tájékoztató és jelentkezés, session belépés, tanulói órák/fájlok, admin jelentkezés/felhasználó/óra/fájl/audit panel készült. React komponensek tényleges API hívásokkal dolgoznak; nincs mock állapotot valósnak mutató fallback.

Arculat: krém/zsályazöld, Manrope + DM Sans saját kiszolgálással, editorial szöveg, CSS/SVG tanulási illusztráció, visszafogott animáció. Marketing copy rövid, a hiányzó üzleti adatok helyőrzők. Az eredeti feladat a helyi működés és későbbi Docker/Ubuntu/Cloudflare felkészítés volt; az alapimplementáció idején éles telepítés még nem történt.

Build generálja a 13 ismert útvonal HTML-jét, a 404 oldalt, a sitemapet és robots fájlt. Admin/tanuló/belépés és jogi piszkozatok noindex. Docker és main CI image-publikálás előkészítve. Módosítási útmutató az AGENTS.md és README.md fájlokban.

Első sikeres helyi ellenőrzés: TypeScript + Vite kliens/SSR/prerender build. JS kb. 83 KB gzip, CSS kb. 8 KB gzip; magyar Latin Extended karakterekhez is saját WOFF2. A teljes rendszer és a böngészős QA eredményei a szomszédos `database/docs/HANDOFF.md` átadási dokumentumába kerülnek.

További fejlesztés előtt külön döntés kell a csoportokhoz rendelt tananyagokról, jelentkezésből fióklétrehozás automatizálásáról, jelszó-visszaállításról, e-mail szolgáltatásról és marketing CMS-ről. Ezeket az első verzió nem ígéri meg.
