import { useEffect, useState, type FormEvent } from 'react';
import { api, errorText, formatCourseDate, formatMoney, json } from './api';
import { PriceDisplay } from './PriceDisplay';
import type { Application, Course, Enrollment, User } from './types';

const value = (form: FormData, name: string) => String(form.get(name) ?? '').trim();
function Feedback({ error, success }: { error: string; success: string }) {
  return <>{error && <p className="notice notice-error" role="alert">{error}</p>}{success && <p className="notice notice-success" role="status">{success}</p>}</>;
}

export function ApplicationAdministration({ application: initial, courses, applications, onUpdated }: { application: Application; courses: Course[]; applications: Application[]; onUpdated: (item: Application) => void }) {
  const [item, setItem] = useState(initial), [error, setError] = useState(''), [success, setSuccess] = useState(''), [busy, setBusy] = useState(false);
  const [target, setTarget] = useState('');
  async function save(event: FormEvent<HTMLFormElement>, transfer = false) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError(''); setSuccess('');
    const body = transfer ? { courseId: Number(value(form, 'courseId')), swapApplicationId: value(form, 'swapApplicationId') ? Number(value(form, 'swapApplicationId')) : null }
      : { contractConfirmed: form.get('contractConfirmed') === 'on', paidTrainingTotal: Number(value(form, 'paidTrainingTotal')), fullPaymentDate: value(form, 'fullPaymentDate') || null, verifiedFriendCount: Number(value(form, 'verifiedFriendCount')) };
    try { const updated = await api<Application>(`/admin/applications/${item.id}/${transfer ? 'course' : 'finance'}`, json('PUT', body)); setItem(updated); if (transfer) setTarget(''); onUpdated(updated); setSuccess(transfer ? 'A csoportváltást mentettük.' : 'A pénzügyi igazolást mentettük.'); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  const f = item.finance;
  return <div className="form-panel edit-panel"><h3>Szerződés és befizetés · {item.studentName}</h3>
    <p className="small muted">Kézi nyilvántartás. A banki / készpénzes befizetést és a barátok fizetését ellenőrizd. A beküldéskori ajánlat változatlan marad. Elfogadáshoz írásbeli szerződés és a szerver által igazolt képzési díj legalább 20%-ának befizetése szükséges. Számlázás: külön, a Számlaközpontban.</p>
    <Feedback error={error} success={success} />
    <form onSubmit={event => void save(event)}><fieldset disabled={busy}>
      <label className="checkbox"><input name="contractConfirmed" type="checkbox" defaultChecked={f.contractConfirmed} /><span>A szerződés létrejöttét ellenőriztem.</span></label>
      <div className="form-grid"><label>Beérkezett képzési díj összesen (Ft)<input name="paidTrainingTotal" type="number" min={0} max={10000000} step={1} required defaultValue={f.paidTrainingTotal} /><small>Laptopbérlés nélkül. Részletfizetés is rögzíthető.</small></label>
        <label>A teljes képzési díj beérkezésének napja<input name="fullPaymentDate" type="date" defaultValue={f.fullPaymentDate ?? ''} /><small>Részletfizetésnél addig maradjon üres, amíg a teljes összeg be nem érkezett.</small></label>
        <label>Igazolt, már fizető barátok száma<input name="verifiedFriendCount" type="number" min={0} max={10} step={1} required defaultValue={f.verifiedFriendCount} /><small>Meghívó / meghívott kapcsolatot egyszer számolj. Visszalépő vagy nem fizető barátot ne igazolj; ilyen változáskor javítsd a darabszámot.</small></label></div>
      <button className="button" disabled={busy}>{busy ? 'Mentés…' : 'Pénzügyi adatok mentése'}</button>
    </fieldset></form>
    <div className="saved-quote"><strong>Igazolt feltételek szerinti képzési díj</strong>{f.trainingTotal != null ? <PriceDisplay total={f.trainingTotal} baseTotal={item.baseTotal} perLesson={f.trainingTotal / 80} compact /> : <p>Korábbi jelentkezés, nincs mentett alapdíj. Egyedi egyeztetés szükséges.</p>}
      <p><strong>Elfogadáshoz szükséges előleg: {f.minimumAdvanceTotal == null ? "Korábbi adat, egyedi ellenőrzés" : formatMoney(f.minimumAdvanceTotal)}</strong></p><p>Beérkezett: {formatMoney(f.paidTrainingTotal)} · {f.trainingBalance != null && <>{f.trainingBalance < 0 ? 'Túlfizetés' : 'Hátralék'}: {formatMoney(Math.abs(f.trainingBalance))}</>}</p>
      <p className="small">Korai kedvezmény: {f.periodDiscountPercent}%. Teljes kedvezmény: {f.discountPercent}%. A korai kedvezményhez a teljes díjnak be kell érkeznie a határidőig.</p>
      <p className="small">Laptopbérlés külön: {f.laptopRentalFee == null ? 'Korábbi igény, egyeztetendő' : formatMoney(f.laptopRentalFee)}. A képzési befizetések fenti összesítője ezt nem tartalmazza.</p></div>
    {item.courseId && <details><summary>Csoportváltás vagy helycsere</summary><form onSubmit={event => void save(event, true)}><fieldset disabled={busy}>
      <label>Új csoport<select name="courseId" required value={target} onChange={e => setTarget(e.target.value)}><option value="">Válassz csoportot</option>{courses.filter(c => c.id !== item.courseId).map(c => <option key={c.id} value={c.id}>{c.name} · {c.availableSeats} szabad hely</option>)}</select></label>
      <label>Cserepartner (csak betelt célcsoportnál szükséges)<select key={target} name="swapApplicationId"><option value="">Átjelentkezés szabad helyre</option>{applications.filter(a => a.courseId === Number(target) && a.status === 'ACCEPTED' && a.id !== item.id).map(a => <option key={a.id} value={a.id}>{a.studentName} · #{a.id}</option>)}</select></label>
      <p className="small muted">Helycsere két elfogadott jelentkező között lehetséges. A hozzárendelt tanulói fiókok hozzáférése is az új csoportot követi.</p><button className="button button-outline">Csoportváltás mentése</button>
    </fieldset></form></details>}
  </div>;
}

export function EnrollmentAdmin({ user }: { user: User }) {
  const [items, setItems] = useState<Application[]>([]), [access, setAccess] = useState<Enrollment | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  async function load() { setLoading(true); try { const [apps, grants] = await Promise.all([api<Application[]>('/admin/applications'), api<Enrollment[]>('/admin/enrollments')]); setItems(apps.filter(a => a.status === 'ACCEPTED')); setAccess(grants.find(a => a.userId === user.id) ?? null); } catch (e) { setError(errorText(e)); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, [user.id]);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError(''); setSuccess(''); try { await api(`/admin/users/${user.id}/enrollment`, json('PUT', { applicationId: Number(value(form, 'applicationId')) })); await load(); setSuccess('Hozzáférés mentve. A tanulónak újra be kell lépnie.'); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } }
  async function revoke() { setBusy(true); setError(''); try { await api(`/admin/users/${user.id}/enrollment`, { method: 'DELETE' }); await load(); setSuccess('A tananyag-hozzáférést visszavontuk.'); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } }
  return <div className="form-panel edit-panel"><h3>Tanulói hozzáférés · {user.name}</h3><Feedback error={error} success={success} />
    {loading ? <p role="status">Hozzáférés betöltése…</p> : <><p>{access?.courseName ?? 'Még nincs hozzárendelt csoport.'}{access?.expiresOn && <> · Hozzáférés vége: {formatCourseDate(access.expiresOn)} · {access.active ? 'Aktív' : 'Inaktív'}</>}</p>
      <form onSubmit={save}><fieldset disabled={busy}><label>Elfogadott jelentkezés<select name="applicationId" required key={access?.applicationId ?? 'none'} defaultValue={access?.applicationId ?? ''}><option value="">Válassz jelentkezést</option>{items.map(a => <option value={a.id} key={a.id}>{a.studentName} · {a.courseName} · #{a.id}</option>)}</select></label><button className="button">Hozzáférés hozzárendelése</button>{access?.applicationId && <button type="button" className="text-button danger" onClick={() => void revoke()}>Hozzáférés visszavonása</button>}</fieldset></form></>}
    <p className="small muted">Csak saját csoport, a képzés zárónapját követő egy hónapig. A fiók létrehozása önmagában nem ad tananyag-hozzáférést. A belépési adatokat kézzel add át.</p></div>;
}

export function CoursesAdmin() {
  const [courses, setCourses] = useState<Course[]>([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  useEffect(() => { api<Course[]>('/courses').then(setCourses).catch(e => setError(errorText(e))); }, []);
  async function save(event: FormEvent<HTMLFormElement>, course: Course) { event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError(''); setSuccess(''); try { const updated = await api<Course>(`/admin/courses/${course.id}`, json('PUT', { registrationOpen: form.get('registrationOpen') === 'on', sessionDates: value(form, 'dates').split(/\s+/).filter(Boolean) })); setCourses(old => old.map(c => c.id === updated.id ? updated : c)); setSuccess(`${updated.name}: naptár mentve.`); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } }
  return <><h2>Csoportok és naptár</h2><p>A jelentkezés az indulás után két héttel automatikusan zárul. Minimum 15, maximum 24 fő; betelt csoportnál 5 fős várólista. A zárónap változtatása a tanulói hozzáférés végét is módosítja.</p><Feedback error={error} success={success} /><div className="form-grid">{courses.map(c => <form className="form-panel" onSubmit={e => void save(e, c)} key={c.id}><h3>{c.name}</h3><fieldset disabled={busy}><label>20 alkalom dátuma, soronként egy dátum<textarea name="dates" rows={10} required defaultValue={c.sessionDates.join('\n')} /></label><label className="checkbox"><input name="registrationOpen" type="checkbox" defaultChecked={c.acceptingApplications} /><span>Jelentkezés engedélyezve a határidőig</span></label><p className="small">Általános jelentkezési határidő: {formatCourseDate(c.registrationClosesOn)}</p><button className="button">Naptár mentése</button></fieldset></form>)}</div></>;
}
