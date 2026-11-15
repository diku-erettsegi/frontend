import type { ReactNode } from 'react';
import './learning-content.css';

type Answer = { question: string; answer: ReactNode };

function AnswerCards({ answers }: { answers: Answer[] }) {
  return <div className="learning-answer-grid">{answers.map(({ question, answer }, index) =>
    <article className="learning-answer" key={question}>
      <span className="learning-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{question}</h3><p>{answer}</p>
    </article>)}
  </div>;
}

function LearningPhoto({ parent = false }: { parent?: boolean }) {
  return <figure className="learning-photo"><img
    src={parent ? '/images/stock-kozos-gyakorlas.webp' : '/images/stock-tanulopar.webp'}
    alt={parent ? 'Stockfotó: diákok közösen dolgoznak egy laptop mellett.' : 'Stockfotó: két fiatal laptoppal és jegyzetekkel tanul.'}
    width="1000" height="667" loading="lazy" /></figure>;
}

function RecordingNote() {
  return <p className="learning-recording-note"><strong>A magyarázatot vesszük fel.</strong> Minden órán csak az oktató hangját és képernyőjét rögzítjük; a diákok hangja, képe és neve nem kerül a felvételre. <a href="/adatkezeles">A felvételek adatkezelése →</a></p>;
}

export function ExamChoiceBlock() {
  return <section className="learning-choice" aria-labelledby="exam-choice-title">
    <div><div className="eyebrow">Emelt érettségit választasz?</div><h2 id="exam-choice-title">Könnyebben átlátható emeltet keresel, amire jól felkészülhetsz?</h2></div>
    <div><p>A digitális kultúra többféle továbbtanulási iránynál is jó választás lehet. Konkrét feladattípusokon gyakorolhatsz, a programozás, az adatkezelés és a táblázatkezelés pedig az érettségi után is hasznos tudás. Mi lépésről lépésre segítünk eljutni az önálló megoldásig.</p><p className="learning-choice-note">A jó eredményhez rendszeres gyakorlás kell. A felvételi beszámítás és az emeltért járó pontok intézményenként, szakonként eltérnek: a kiszemelt képzés aktuális követelményeit mindig ellenőrizd.</p><div className="learning-links"><a className="text-link" href="/oktatas-menete">Megnézem, hogyan készülhetek <span aria-hidden="true">→</span></a><a className="text-link" href="https://www.felvi.hu/felveteli/pontszamitas/pontszamitas_27_28">2027-es követelmények a Felvin <span aria-hidden="true">↗</span></a></div></div>
  </section>;
}

export function StudyJourney({ audience = 'student' }: { audience?: 'student' | 'parent' }) {
  const parent = audience === 'parent';
  return <section className="learning-journey">
    <div className="learning-section-heading"><div className="eyebrow">Tantermi figyelem + otthoni szabadság</div><h2>{parent ? 'A szombati óra után is van mire támaszkodni.' : 'Együtt megértjük. Otthon begyakorlod.'}</h2><p>{parent ? 'A személyes segítséghez visszanézhető magyarázat és önálló gyakorlás társul. Így két alkalom között sem kell mindent emlékezetből felidézni.' : 'A tanteremben kérdezhetsz és segítséget kapsz. Otthon ugyanazt a gondolatmenetet a saját tempódban is újra végigveheted.'}</p></div>
    <ol className="learning-steps">
      <li><span aria-hidden="true">01 / A tanteremben</span><h3>Kipróbálod, kérdezel.</h3><p>Rövid magyarázat után te oldod meg a feladatot. Két oktató jár körbe, figyel a munkára, és segít, amikor elakadsz.</p></li>
      <li><span aria-hidden="true">02 / Otthon</span><h3>Megállítod, újraveszed.</h3><p>Minden óra oktatói felvétele visszanézhető. A segítő fájlokkal és külön otthoni gyakorló feladatsorokkal a saját tempódban ismételhetsz.</p></li>
      <li><span aria-hidden="true">03 / A következő alkalmon</span><h3>Hozod a kérdéseidet.</h3><p>Írd fel, melyik lépésnél bizonytalanodtál el. A tanteremben megbeszéljük, és újabb feladatokon próbálhatod ki, amit megértettél.</p></li>
    </ol>
    <RecordingNote />
  </section>;
}

export function LearningPageContent() {
  return <div className="learning-content">
    <section className="learning-photo-story"><div><div className="eyebrow">Gyakorlatias oktatás</div><h2>Nézni már tudod.<br />Megoldani is menni fog?</h2><p>Ezért a feladatmegoldásra építjük az órákat. A magyarázatot rögtön kipróbálod: kódot írsz, adatokat rendezel, megkeresed a hibát. Így az is kiderül, melyik lépés világos, és hol kell még segítség.</p><p>A cél, hogy egy új feladatnál is tudd, hogyan indulj el. Az írásbeli mellett a megoldások elmagyarázását és a szóbelit is gyakoroljuk.</p></div><LearningPhoto /></section>
    <section className="learning-block"><div className="learning-section-heading"><div className="eyebrow">Miért személyesen?</div><h2>Egy teremben a kérdésed is hamarabb látszik.</h2></div><AnswerCards answers={[
      { question: 'Mi van, ha nem tudom, mit kérdezzek?', answer: 'Körbejárunk, látjuk, hogyan haladsz a feladattal. Nem kell megvárnod, amíg tökéletesen megfogalmazod a problémát: együtt megkeressük az elakadás okát.' },
      { question: 'Tényleg jut rám figyelem?', answer: 'Legfeljebb 24 diákra két oktató figyel. Odaléphetünk a gépedhez, megnézhetjük a megoldásodat, és közvetlenül arra válaszolhatunk, ami neked kérdés.' },
      { question: 'Mi tartja meg a tanulás ritmusát?', answer: 'A fix szombati időpont, a közös munkára szánt tér és az élő beszélgetés. Látod mások ötleteit is, miközben a saját feladatodon dolgozol.' },
    ]} /></section>
    <StudyJourney />
    <section className="learning-block"><div className="learning-section-heading"><div className="eyebrow">A tempódhoz is alkalmazkodunk</div><h2>Elakadtál? Elkészültél? Mindkettőre van következő lépés.</h2></div><AnswerCards answers={[
      { question: 'Gyorsan végzek. Várnom kell?', answer: 'Minden órán készülünk pluszfeladatokkal. Ha az alapfeladat már megy, jöhet egy új feltétel vagy összetettebb megoldás: lesz min gondolkodnod.' },
      { question: 'Több idő kell egy témához?', answer: 'Kérdezz rá az órán, otthon pedig állítsd meg és nézd vissza a magyarázatot. Az önálló gyakorló feladatsorokból a szabadidődben is dolgozhatsz.' },
      { question: 'Honnan tudom, készen állok-e?', answer: 'A feladataidra visszajelzést kapsz, a próbaérettségiken pedig az időbeosztást és a vizsgahelyzetet is kipróbálod. A hibákból látjuk, mit érdemes még gyakorolni.' },
    ]} /></section>
  </div>;
}

export function AudienceContent({ parent }: { parent: boolean }) {
  const answers: Answer[] = parent ? [
    { question: 'Észreveszik, ha a gyermekem elakad?', answer: 'Két oktató dolgozik a legfeljebb 24 fős csoporttal. Körbejárunk, figyeljük a megoldásokat, és személyesen segítünk. A diáknak nem kell egyedül kitalálnia, miért nem működik a feladata.' },
    { question: 'Mi történik, ha eltérő a tempója?', answer: 'A gyorsabban haladóknak minden órán van pluszfeladat. Aki többet ismételne, személyes segítséget kérhet, majd otthon visszanézheti az oktatói magyarázatot.' },
    { question: 'Látszik, hogy halad-e?', answer: <>Az órai munkára és a próbaérettségire visszajelzést adunk. Szülőként kérésre legfeljebb 4 alkalommal kapsz tájékoztatást a képzés során. Nagykorú diáknál ehhez az ő kifejezett felhatalmazása szükséges.</> },
  ] : [
    { question: 'Kérdezhetek, ha másnak már világos?', answer: 'Igen. Nem kell úgy tenned, mintha értenéd. Két oktató jár körbe, megnézzük a képernyődet és a gondolatmenetedet. Egy konkrét elakadásból együtt keresünk kiutat.' },
    { question: 'Mi van, ha hamar kész vagyok?', answer: 'Jöhet a következő kihívás. Mindig lesznek pluszfeladatok: kipróbálhatsz egy másik megoldást, vagy továbbépítheted azt, ami már megy.' },
    { question: 'Otthon jut eszembe a kérdés?', answer: 'Nézd vissza az adott órarészt, próbáld újra a segítő fájlokkal, és írd fel, hol akadtál el. A következő tantermi órán vissza tudunk térni rá.' },
  ];
  return <div className="learning-content">
    <section className="learning-photo-story"><div><div className="eyebrow">{parent ? 'Támogatás, amire lehet építeni' : 'Nem csak figyelsz. Csinálod.'}</div><h2>{parent ? 'Csak végignéz egy órát, vagy valóban gyakorol?' : 'Mi kell ahhoz, hogy egyedül is menjen?'}</h2><p>{parent ? 'Nálunk a gyakorlati feladatmegoldás áll a középpontban. A diák a saját gépén dolgozik, kérdez, hibázik és javít. Az oktató így a munkafolyamatot is látja, nem csak a kész választ.' : 'Nem hosszú magyarázatokat kell végigülnöd. Röviden átbeszéljük az alapot, aztán te próbálod ki. Kódolsz, feladatot oldasz meg, és közben bármikor kérdezhetsz.'}</p><p>{parent ? 'A fix tantermi alkalmak keretet adnak, az otthoni anyagok pedig lehetőséget az ismétlésre. A haladáshoz a diák saját, rendszeres munkájára is szükség van.' : 'A személyes jelenlét azt jelenti, hogy oda tudunk ülni melléd, együtt megnézni egy hibát, vagy rögtön tisztázni egy bizonytalan lépést. Az a cél, hogy legközelebb önállóan is elindulj.'}</p></div><LearningPhoto parent={parent} /></section>
    <section className="learning-block"><div className="learning-section-heading"><h2>{parent ? 'A figyelem a részleteknél számít.' : 'A saját tempódnak is van helye.'}</h2></div><AnswerCards answers={answers} /></section>
    <StudyJourney audience={parent ? 'parent' : 'student'} />
    {!parent && <ExamChoiceBlock />}
    <section className="learning-practical"><div><div className="eyebrow">A döntéshez még jól jöhet</div><h2>{parent ? 'Belefér a család hetébe?' : 'Kezdenék. Mit kell tudnom?'}</h2><p>{parent ? '20 szombati alkalom, összesen 80 tanóra; délelőtt 9–13 vagy délután 14–18 óra között, szünetekkel. Kezdés: 2027. január 9. Otthon a külön gyakorló feladatsorokra a diák a saját szabadidejében térhet vissza.' : '14 éves kortól várunk, nincs előismereti feltétel vagy szintfelmérő. Hozd a laptopodat és a kérdéseidet. Hetente szombaton találkozunk, a két alkalom közötti gyakorláshoz pedig feladatsorokat is kapsz.'}</p></div><div><h3>{parent ? 'Mivel számoljunk jelentkezés előtt?' : 'Kell saját gép? És vizsgarutin?'}</h3><p>{parent ? 'Beszéljétek át a kitűzött célt, a szombati időbeosztást és az önálló munkára szánt időt. A teljes alapdíj 280 000 Ft, amelyből korai és baráti kedvezmények érvényesíthetők.' : 'Saját laptopon dolgozhatsz. A próbaérettségin vizsgaszerű helyzetben is kipróbálod, mire jutottál; utána átbeszéljük a megoldásokat. A szóbelire is külön készülünk.'}</p><p>Ha laptopot bérelnél, a díja 30 000 Ft a teljes képzésre, kizárólag helyszíni órai használatra.</p><div className="learning-links"><a href="/arak" className="text-link">Árak és kedvezmények <span aria-hidden="true">→</span></a><a href={parent ? '/diakoknak' : '/erettsegi-feladatsorok'} className="text-link">{parent ? 'Mutasd meg a diáknak is' : 'Hivatalos feladatsorok gyakorláshoz'} <span aria-hidden="true">→</span></a></div></div></section>
  </div>;
}
