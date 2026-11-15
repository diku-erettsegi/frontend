# Tartalmi módosítások

## Oktatás menete: pontosítási blokk eltávolítása – 2026. november 15.

Éles ellenőrzés sikeres: `c011ad2`, GitHub Actions `43725972104` success, deploy 2026-11-15 15:47:47 Budapest. Publikus HTTP 200; „Pontosítás alatt” nincs, órarend megmaradt. Négy healthy konténer, nincs függő kiadás. Frontend image `sha256:fa136b6312daa574ded12f77a4e29bfd80a1f5116e6185a04ed008648d768d08`. Helyi build és 10/10 teszt sikeres.

Felhasználói kérésre az `/oktatas-menete` oldal aljáról a teljes „Pontosítás alatt” helyőrző blokk eltávolítva, a benne szereplő szöveggel együtt. A tanulási tartalom, órarend, tanulói fájlok és kurzus CTA megmarad. Nincs új adat, API- vagy stílusváltozás. Ellenőrzés: production build, meglévő frontendtesztek és éles HTML a kiadás után.

## Oktatói portréhelyek eltávolítása – 2026. november 15.

Felhasználói kérésre az oktatói portréhelyőrzők és a „portréja hamarosan” feliratok eltűntek. Helyettük egyszerű H2 névcímek: Balázs és Peti. Nincs üres képoszlop vagy portrényi fenntartott hely; mindkét bemutatkozás azonos szélességű és a közös grid által kiegyenlített magasságú marad. A jóváhagyott életrajzi bekezdések változatlanok. Mobilon egy oszlop, asztalon két oszlop. A korábbi portrés leírások történetiek.

Ellenőrzés: production build (19 útvonal + 404), 10 frontendteszt és diff-ellenőrzés sikeres. Böngészős vizuális próba nem történt. Élesítés kész: `01f8f08`, GitHub Actions `43725441473` success; szerveres utolsó siker 2026-11-15 14:40:22 UTC (15:40:22 Budapest). Publikus `/oktatok` HTTP 200, két névcím: Balázs/Peti, nincs portrait-placeholder. Négy healthy konténer, nincs függő kiadás/helyreállítás. Frontend image: `sha256:6e151cec740defec6d1c5ca15e8a738e42660532a682daba43a6ca46528715e8`. A konténercsere alatti átmeneti 502 megszűnt.

## Azonos méretű oktatói szövegkártyák – 2026. november 15.

A felhasználó kérésére az `/oktatok` oldalon Balázs és Peti szövegdoboza egyforma szélességű és magasságú. A `src/launch.css` korábbi 1.35:1 asztali oszloparányát két egyenlő oszlop váltja. A profilok kitöltik a közös grid-sort, a szövegrész egységes belső térközt, finom keretet és hátteret kap. A portrék külön a profil tetejéhez igazodnak; nem nyúlnak meg a szöveggel.

1100 px alatt a portré a teljes szélességű szöveg fölé kerül, így a 901–1100 px közötti tartományban sem szűkíti oldalról a bemutatkozást. A portré legfeljebb 160 px széles, 3:4 arányú; 640 px alatt 120 px. 640 px alatt a két profil egymás alatt jelenik meg, továbbra is azonos magasságú grid-sorokban. A magasságot a hosszabb tartalom határozza meg: nincs fix pixelmagasság, levágás, görgethető szövegdoboz vagy eltérő betűméret. Az előzőleg jóváhagyott E/1-es szövegek változatlanok. A portréhelyőrzők és a rövidebb kiemelő címek helyigénye mindkét kártyán egyezik.

Ellenőrzés: a végleges, telefonos kapcsolati kiegészítéssel közös production build (19 útvonal + 404), mind a 10 meglévő frontendteszt és `git diff --check` sikeres. A kódellenőrzés 1100 px-re emelte a portré-fölé elrendezés határát, következetes 900/640 px-es felülírásokkal. A kártyamódosítás az oktatók szövegét nem változtatta. Böngészős vizuális ellenőrzés a korábban dokumentált eszközkorlát miatt nem állítható sikeresnek. Az élesítés eredményét a közös `../../database/docs/DEPLOY-STATUS.md` követi.

## Oktatói bemutatkozások – 2026. november 15.

A felhasználó új Peti-bemutatkozása alapján az `/oktatok` oldalon megjelenik a szoftverfejlesztő végzettség, négy év kiscsoportos korrepetálás, több száz diák, online és tantermi tapasztalat, valamint a Budapesti Műszaki és Gazdaságtudományi Egyetemen folytatott tanulmányok. A harmadik bekezdés a jó hangulatról, az önálló gondolkodásról és a megoldás felfedezésének motiváló erejéről szól. Ezek felhasználói adatok; további életrajzi tényt nem egészítettünk ki.

Peti és Balázs bemutatkozása egyaránt egyes szám első személyű. Balázs korábban jóváhagyott életrajzi tényei megmaradtak. Helyesírási és nyelvi javítások: „online és tantermi környezetben egyaránt”, „magadtól jössz rá”, az egyetem hivatalos teljes nevének megtartása. A közös oldalbevezető a két oktatót együtt mutatja be; ez nem egyéni bemutatkozás.

Forráskód: `src/App.tsx`, `Teachers`. Nincs új útvonal, CSS-, API-, árazási vagy jogosultságváltozás. Mindkét oktató három bekezdésben mutatkozik be a meglévő elrendezésben. Ellenőrzés: production build (19 útvonal + 404) és mind a 10 meglévő frontendteszt sikeres; az éles kiadás bizonyítéka a `../../database/docs/DEPLOY-STATUS.md` fájlban követhető.
