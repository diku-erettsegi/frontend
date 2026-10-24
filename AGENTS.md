# Következő agenteknek

- Először olvasd el a `README.md` fájlt és a szomszédos `database/docs` architektúra/API/üzemeltetési dokumentumait.
- Stack: React + TypeScript + Vite. Az oldalak buildkor szerveroldalon előrenderelődnek; ne alakítsd puszta CSR SPA-vá, mert a teljes HTML SEO-követelmény.
- Az új publikus útvonalat a `src/seo.ts`, `src/App.tsx`, `nginx.conf` és SEO teszt útvonallistájában is vezesd át. Pontosan egy H1, egyedi title, description és canonical legyen.
- Render során nincs `window`, `document`, localStorage vagy időpontfüggő markup. Böngésző API-k csak effectben/eseménykezelőben; ezzel a build és hidratálás stabil marad.
- Valódi adatot az API kezel; ne vezess be csendes localStorage/mock siker-válaszokat. Jogosultságot a backend ellenőriz, a frontend guard csak UX.
- Minden módosító API kérés a `src/api.ts` kliensen menjen session + CSRF védelemmel. Belépés/kilépés után token reset szükséges.
- Ne tegyél titkot VITE_ változóba: ezek a kliens csomagjába kerülnek. A local profil tesztfiókjait ne mutasd az éles UI-ban.
- Az aktuális képzési adatok a `../database/docs/STRATEGY-2026-10.md` szerint ismertek: 2027-01-09, két szombati csoport, 80 tanóra, 24 fő/csoport, Balázs és Peti, Gábor Dénes Egyetem, 280 000 Ft alapdíj. Csak a még hiányzó adatokat jelöld helyőrzővel; ne találj ki portrét, pontos termet, telefonszámot, jogi szöveget vagy eredményt.
- A kedvezmények összeadódnak maximum 35%-ig; a mentett ár mérvadó forrása a backend. A baráti jogosultságot admin egyezteti. A programozós érdeklődők státuszát és megjegyzését kézzel kezeljük; nincs automatikus e-mail/SMTP. A nyilvános képek stockfotók, eredetük a `../database/docs/IMAGE-ASSETS.md` fájlban követhető; AI-generált marketingképet ne adj hozzá.
- Magyar, rövid, szülőknek is érthető UI-szöveg. Maradjon nyugodt, könnyű a felület, a jelentkezés elérhető legyen minden publikus oldalon.
- Ne tölts be harmadik fél betűkészletet, követőkódot vagy térképet külön termékdöntés nélkül. A betűk a helyi Fontsource csomagokból jönnek.
- Ellenőrzés módosítás után: `npm run build`, majd `npm test`; releváns mobil/asztali és API folyamat ellenőrzés. Dokumentáld a valós ellenőrzési korlátokat.
- Nginx valódi404/relative301/CSP/tunnel-proxy szerződés lényeges. Az éles frontend és backend kizárólag belső Docker-hálózaton legyen.
- A VPS első telepítése megtörtént; az aktuális automatizálási állapot a `../database/docs/DEPLOY-STATUS.md` fájlban van. A domain névszerverváltását a felhasználó későbbre halasztotta. A munkamenetben adott deploy/push felhatalmazást vedd figyelembe; új, azon kívüli publikálást külön egyeztess.
