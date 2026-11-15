# Tartalmi módosítások

## Oktatói bemutatkozások – 2026. november 15.

A felhasználó új Peti-bemutatkozása alapján az `/oktatok` oldalon megjelenik a szoftverfejlesztő végzettség, négy év kiscsoportos korrepetálás, több száz diák, online és tantermi tapasztalat, valamint a Budapesti Műszaki és Gazdaságtudományi Egyetemen folytatott tanulmányok. A harmadik bekezdés a jó hangulatról, az önálló gondolkodásról és a megoldás felfedezésének motiváló erejéről szól. Ezek felhasználói adatok; további életrajzi tényt nem egészítettünk ki.

Peti és Balázs bemutatkozása egyaránt egyes szám első személyű. Balázs korábban jóváhagyott életrajzi tényei megmaradtak. Helyesírási és nyelvi javítások: „online és tantermi környezetben egyaránt”, „magadtól jössz rá”, az egyetem hivatalos teljes nevének megtartása. A közös oldalbevezető a két oktatót együtt mutatja be; ez nem egyéni bemutatkozás.

Forráskód: `src/App.tsx`, `Teachers`. Nincs új útvonal, CSS-, API-, árazási vagy jogosultságváltozás. Mindkét oktató három bekezdésben mutatkozik be a meglévő elrendezésben. Ellenőrzés: production build (19 útvonal + 404) és mind a 10 meglévő frontendteszt sikeres; az éles kiadás bizonyítéka a `../../database/docs/DEPLOY-STATUS.md` fájlban követhető.
