import { Arrow } from './App';
import { examSources, examSourcesCheckedAt } from './examSources';

export function ExamResources() {
  return <>
    <div className="exam-intro"><div><h2>Emelt szint. Eredeti forrás.</h2><p>Az alábbi linkek az Oktatási Hivatal oldalára és az ott közzétett eredeti fájlokra vezetnek. A feladatlapok mellett a forrásfájlokat, a javítási útmutatót és a megoldásokat is eléred.</p></div><ol><li>Töltsd le a feladatlapot és a hozzá tartozó forrásfájlokat.</li><li>Próbáld meg önállóan, a feladatlapon jelzett időkeretben.</li><li>A javítási útmutatót csak utána nézd meg, és írd össze a kérdéseidet.</li></ol></div>
    <div className="exam-list">{examSources.map(source => <article className="exam-row" key={source.paperUrl}><div><h2>{source.title}</h2><p className="exam-level">Digitális kultúra · emelt szint</p></div><div><div className="exam-links"><a href={source.paperUrl} target="_blank" rel="noopener noreferrer">Feladatlap · PDF <Arrow diagonal /></a><a href={source.guideUrl} target="_blank" rel="noopener noreferrer">Javítási útmutató · PDF <Arrow diagonal /></a><a href={source.filesUrl} target="_blank" rel="noopener noreferrer">Forrásfájlok · ZIP <Arrow diagonal /></a><a href={source.solutionsUrl} target="_blank" rel="noopener noreferrer">Megoldások · ZIP <Arrow diagonal /></a></div><a className="exam-source" href={source.sourceUrl} target="_blank" rel="noopener noreferrer">Hivatalos forrás: Oktatási Hivatal ↗</a></div></article>)}</div>
    <p className="exam-checked">A hivatkozások ellenőrzése: {examSourcesCheckedAt}. A linkek új lapon nyílnak meg. A vizsgadokumentumok kiadója az Oktatási Hivatal.</p>
    <div className="inline-cta"><div><h2>Elakadtál egy feladatnál?</h2><p className="small muted">A tanteremben a megoldás gondolatmenetét is átbeszéljük.</p></div><a className="button" href="/kurzusok">Megnézem a kurzusokat <Arrow /></a></div>
  </>;
}
