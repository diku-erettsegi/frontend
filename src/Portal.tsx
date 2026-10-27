import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError, errorText, formatCourseDate, formatDate, formatMoney, json, resetCsrf, safeMeetingUrl } from './api';
import { Arrow, Icon } from './App';
import { DiscountBadge, PriceDisplay } from './PriceDisplay';
import type { Application, ApplicationReceipt, ApplicationStatus, Audit, Course, InterestStatus, Lesson, ProgrammingInterest, ProgrammingInterestReceipt, Role, User } from './types';
import './portal.css';

const formValue = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
function ErrorMessage({ text }: { text: string }) { return text ? <div className="notice notice-error" role="alert">{text}</div> : null; }
function Success({ text }: { text: string }) { return text ? <div className="notice notice-success" role="status">{text}</div> : null; }
function Loading() { return <div className="empty-state" role="status"><span className="loader" /> Adatok betöltése…</div>; }
function Empty({ children }: { children: React.ReactNode }) { return <div className="empty-state"><Icon kind="book" /><p>{children}</p></div>; }
const applicationsEnabled = import.meta.env.DEV || import.meta.env.VITE_APPLICATIONS_ENABLED === 'true';

function useCourses(enabled = true) {
  const [courses, setCourses] = useState<Course[]>([]), [loading, setLoading] = useState(enabled), [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { setCourses(await api<Course[]>('/courses')); }
    catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (enabled) void load(); }, [enabled]);
  return { courses, loading, error, load };
}

// A retry with the same payload keeps its UUID; changed input starts a new logical request.
// UUID generation happens in the submit event, never during SSR/hydration.
function useSubmissionRequest() {
  const pending = useRef(false);
  const request = useRef<{ signature: string; id: string } | null>(null);
  function requestId(payload: unknown) {
    const signature = JSON.stringify(payload);
    if (!request.current || request.current.signature !== signature) request.current = { signature, id: crypto.randomUUID() };
    return request.current.id;
  }
  return { pending, requestId, reset: () => { request.current = null; } };
}

const courseTime = (course: Course) => `${course.startTime.slice(0, 5)}–${course.endTime.slice(0, 5)}`;

function CourseQuote({ course, friendCount = 0, referredByFriend = false }: { course: Course; friendCount?: number; referredByFriend?: boolean }) {
  const periodPercent = course.price.periodDiscountPercent ?? course.price.discountPercent;
  const friendPercent = 5 * Math.max(friendCount, referredByFriend ? 1 : 0);
  const discountPercent = Math.min(35, periodPercent + friendPercent);
  const total = Math.round(course.price.baseTotal * (100 - discountPercent) / 100);
  const perLesson = total / (course.sessions * course.lessonsPerSession);
  return <div className="course-quote">
    <div className="course-offer-heading">
      <div><strong>{discountPercent > 0 ? friendPercent > 0 ? 'Kedvezményed együtt' : course.price.discountLabel : 'Teljes képzési díj'}</strong>
        {periodPercent > 0 && course.price.validUntil && <p>Jelentkezés {formatCourseDate(course.price.validUntil)} napjáig</p>}
      </div>
      <DiscountBadge percent={discountPercent} />
    </div>
    <PriceDisplay total={total} baseTotal={course.price.baseTotal} perLesson={perLesson} lessonCount={course.sessions * course.lessonsPerSession} />
    {friendPercent > 0 && <p className="course-offer-note">{periodPercent > 0 && <>{periodPercent}% korai + </>}{friendPercent}% baráti kedvezmény, összesen legfeljebb 35%. A baráti jogosultságot egyeztetjük.</p>}
  </div>;
}

export function CoursesSection() {
  const { courses, loading, error, load } = useCourses();
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  function choose(id: number) {
    setSelectedCourseId(id);
    formRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    formRef.current?.querySelector<HTMLSelectElement>('select[name="courseId"]')?.focus({ preventScroll: true });
  }
  return <div className="course-registration">
    <div className="course-cards" aria-label="Választható szombati csoportok">
      {courses.length ? courses.map(course => <article className={`course-card${selectedCourseId === course.id ? ' is-selected' : ''}`} key={course.id}>
        <span className="eyebrow">Emelt digitális kultúra</span><h2>{course.name}</h2>
        <p className="course-time">Szombatonként · {courseTime(course)}</p>
        <CourseQuote course={course} />
        <dl className="course-details"><dt>Indulás</dt><dd>{formatCourseDate(course.startDate)}</dd><dt>Időtartam</dt><dd>{course.sessions} alkalom × {course.lessonsPerSession} tanóra</dd><dt>Csoportlétszám</dt><dd>Legfeljebb {course.capacity} fő</dd></dl>
        <p className="small muted">{course.availableSeats > 0 ? `${course.availableSeats} szabad hely az elfogadott jelentkezések alapján.` : 'A csoport jelenleg betelt.'}</p>
        <button type="button" className={`button ${selectedCourseId === course.id ? '' : 'button-outline'}`} disabled={!course.registrationOpen || course.availableSeats === 0} aria-pressed={selectedCourseId === course.id} onClick={() => choose(course.id)}>{selectedCourseId === course.id ? 'Kiválasztott csoport' : course.registrationOpen && course.availableSeats > 0 ? 'Ezt a csoportot választom' : 'Jelenleg nem jelentkezhető'} <Arrow /></button>
      </article>) : ['Délelőtti csoport', 'Délutáni csoport'].map((name, index) => <article className="course-card" key={name}>
        <span className="eyebrow">Emelt digitális kultúra</span><h2>{name}</h2><p className="course-time">Szombatonként · {index === 0 ? '09:00–13:00' : '14:00–18:00'}</p>
        <dl className="course-details"><dt>Indulás</dt><dd>2027. január 9.</dd><dt>Időtartam</dt><dd>20 alkalom × 4 tanóra</dd><dt>Csoportlétszám</dt><dd>Legfeljebb 24 fő</dd></dl>
        <p className="small muted">Az aktuális ár és a jelentkezési lehetőség betöltés után jelenik meg.</p>
      </article>)}
    </div>
    {loading && <p className="course-loading" role="status">Az aktuális csoportok és árak betöltése…</p>}
    <ErrorMessage text={error} />{error && <button type="button" className="button button-outline" onClick={() => void load()}>Csoportok újratöltése</button>}
    {!loading && !error && !courses.length && <Empty>Jelenleg nincs megnyitott kurzus. A következő indulás részletei hamarosan itt jelennek meg.</Empty>}
    <div className="course-application" id="jelentkezesi-urlap" ref={formRef}>
      <ApplicationForm courses={courses} selectedCourse={selectedCourseId} onCourseChange={setSelectedCourseId} coursesLoading={loading} onSubmitted={() => void load()} />
    </div>
  </div>;
}

interface ApplicationFormProps { courses?: Course[]; selectedCourse?: number | null; onCourseChange?: (id: number | null) => void; coursesLoading?: boolean; onSubmitted?: () => void }
export function ApplicationForm({ courses: suppliedCourses, selectedCourse, onCourseChange, coursesLoading, onSubmitted }: ApplicationFormProps = {}) {
  const source = useCourses(!suppliedCourses);
  const courses = suppliedCourses ?? source.courses;
  const loading = coursesLoading ?? source.loading;
  const [localCourseId, setLocalCourseId] = useState<number | null>(null), [friendCount, setFriendCount] = useState(0), [referredByFriend, setReferredByFriend] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState<ApplicationReceipt | null>(null);
  const submission = useSubmissionRequest();
  const courseId = selectedCourse === undefined ? localCourseId : selectedCourse;
  const course = courses.find(item => item.id === courseId);
  function select(id: number | null) { setLocalCourseId(id); onCourseChange?.(id); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!applicationsEnabled || submission.pending.current) return;
    if (!course || !course.registrationOpen || course.availableSeats <= 0) { setError('Válassz olyan csoportot, amelyre még lehet jelentkezni.'); return; }
    const form = new FormData(event.currentTarget);
    const payload = { courseId: course.id, studentName: formValue(form, 'studentName'), email: formValue(form, 'email'), phone: formValue(form, 'phone'), parentName: formValue(form, 'parentName'), message: formValue(form, 'message'), privacyAccepted: form.get('privacy') === 'on', friendCount: Number(form.get('friendCount') || 0), referredByFriend: form.get('referredByFriend') === 'on', referralNote: formValue(form, 'referralNote'), laptopRentalRequested: form.get('laptopRentalRequested') === 'on' };
    submission.pending.current = true; setBusy(true); setError('');
    try {
      const result = await api<ApplicationReceipt>('/applications', json('POST', { ...payload, requestId: submission.requestId(payload) }));
      setReceipt(result); submission.reset(); onSubmitted?.();
    } catch (e) { setError(errorText(e)); }
    finally { submission.pending.current = false; setBusy(false); }
  }
  if (receipt) return <div className="success-panel" role="status"><span className="success-icon">✓</span><h2>Megérkezett a jelentkezésed.</h2>
    <p>A jelentkezést rögzítettük. A megadott elérhetőségeid egyikén egyeztetjük a részleteket.</p>
    {receipt.quotedTotal != null && <div className="saved-quote"><div className="course-offer-heading"><div><strong>Rögzített képzési díj</strong>{receipt.courseName && <p>{receipt.courseName}</p>}</div><DiscountBadge percent={receipt.discountPercent ?? 0} /></div><PriceDisplay total={receipt.quotedTotal} perLesson={receipt.quotedPerLesson} />{receipt.discountLabel && <p className="course-offer-note">{receipt.discountLabel}</p>}<p className="small">A baráti kedvezmény jogosultságát és az esetleges laptopbérlést külön egyeztetjük.</p></div>}
    <button type="button" className="button button-outline" onClick={() => { setReceipt(null); setFriendCount(0); setReferredByFriend(false); submission.reset(); }}>Új jelentkezés</button>
  </div>;
  return <form method="post" className="form-panel application-form" onSubmit={submit}>
    <h2>Jelentkezés a kiválasztott csoportba</h2><p className="muted">A csillaggal jelölt mezők kitöltése szükséges.</p>
    {!applicationsEnabled && <div className="notice">Az online jelentkezés még előkészítés alatt áll. Az űrlap az induláskor válik elérhetővé.</div>}
    {import.meta.env.DEV && <div className="dev-note">Helyi fejlesztői űrlap. A végleges adatkezelési tájékoztató még előkészítés alatt áll; teszteléshez fiktív adatokat használj.</div>}
    {!suppliedCourses && <><ErrorMessage text={source.error} />{source.error && <button type="button" className="text-button" onClick={() => void source.load()}>Csoportok újratöltése</button>}</>}
    <fieldset disabled={busy}>
      <label>Csoport *<select name="courseId" required value={courseId ?? ''} disabled={loading || !courses.length} onChange={e => select(e.target.value ? Number(e.target.value) : null)}><option value="">{loading ? 'Csoportok betöltése…' : 'Válassz időpontot'}</option>{courses.map(item => <option key={item.id} value={item.id} disabled={!item.registrationOpen || item.availableSeats === 0}>{item.name} · {courseTime(item)}{!item.registrationOpen || item.availableSeats === 0 ? ' – nem jelentkezhető' : ''}</option>)}</select></label>
      {course && <div className="application-price" aria-live="polite"><p><strong>{course.name}</strong> · szombat {courseTime(course)}<br /><span className="small">Indulás: {formatCourseDate(course.startDate)}</span></p><CourseQuote course={course} friendCount={friendCount} referredByFriend={referredByFriend} /><p className="small muted">A jelentkezéskor érvényes díjat rögzítjük. A baráti kedvezmény jogosultságát egyeztetjük. A beküldés még nem jelent végleges helyfoglalást.</p></div>}
      <div className="form-grid"><label>Tanuló neve *<input autoComplete="name" name="studentName" required maxLength={120} placeholder="Teljes név" /></label><label>E-mail-cím *<input autoComplete="email" name="email" type="email" required maxLength={254} placeholder="pelda@email.hu" /></label><label>Telefonszám *<input autoComplete="tel" name="phone" type="tel" required minLength={6} maxLength={40} placeholder="+36 …" /></label><label>Szülő / gondviselő neve<input name="parentName" maxLength={120} placeholder="Ha releváns" /></label></div>
      <div className="application-extras"><h3>Jönnél baráttal? Szükséged van laptopra?</h3>
        <label>Hány barátot hozol?<input name="friendCount" type="number" min={0} max={10} step={1} value={friendCount} onChange={e => setFriendCount(Number(e.target.value))} aria-describedby="friend-discount-note" /></label>
        <label className="checkbox"><input name="referredByFriend" type="checkbox" checked={referredByFriend} onChange={e => setReferredByFriend(e.target.checked)} /><span>Barát ajánlásával érkezem.</span></label>
        <p className="small muted" id="friend-discount-note">Barátonként 5% kedvezmény jár. Ha barátod hívott, neked is jár 5%. A baráti és a korai jelentkezési kedvezmény összeadódik, összesen legfeljebb 35%-ig. Ugyanazt a baráti kapcsolatot egyszer számoljuk.</p>
        {(friendCount > 0 || referredByFriend) && <label>Egyeztetés a baráti kedvezményhez<textarea name="referralNote" rows={2} maxLength={500} placeholder="Rövid megjegyzés az együtt jelentkezésről. Mások elérhetőségét ne add meg." /></label>}
        <label className="checkbox"><input type="checkbox" name="laptopRentalRequested" /><span>Laptopbérlést szeretnék igényelni. A lehetőségeket és a díjat külön egyeztetjük.</span></label>
      </div>
      <label>Üzenet<textarea name="message" rows={3} maxLength={4000} placeholder="Kérdésed van, vagy megosztanál valamit?" /></label>
      <label className="checkbox"><input name="privacy" type="checkbox" required /><span>Megismertem az <a href="/adatkezeles" target="_blank" rel="noopener">adatkezelési tájékoztatót</a>. *</span></label>
      <ErrorMessage text={error} /><button className="button" disabled={busy || !applicationsEnabled || loading || !course || !course.registrationOpen || course.availableSeats <= 0}>{busy ? 'Küldés folyamatban…' : 'Jelentkezés elküldése'} <Arrow /></button>
    </fieldset><p className="small muted">Az űrlap elküldése jelentkezési szándékot jelez. A részleteket külön egyeztetjük.</p>
  </form>;
}

export function ProgrammingInterestForm() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [submitted, setSubmitted] = useState(false);
  const submission = useSubmissionRequest();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!applicationsEnabled || submission.pending.current) return;
    const form = new FormData(event.currentTarget);
    const payload = { name: formValue(form, 'name'), email: formValue(form, 'email'), privacyAccepted: form.get('privacy') === 'on' };
    submission.pending.current = true; setBusy(true); setError('');
    try { await api<ProgrammingInterestReceipt>('/programming-interests', json('POST', { ...payload, requestId: submission.requestId(payload) })); setSubmitted(true); submission.reset(); }
    catch (e) { setError(errorText(e)); }
    finally { submission.pending.current = false; setBusy(false); }
  }
  if (submitted) return <div className="success-panel interest-success" role="status"><span className="success-icon">✓</span><h3>Rögzítettük az érdeklődésed.</h3><p>A szervezők a megadott e-mail-címen keresnek majd. Ez még nem jelentkezés egy meghirdetett kurzusra.</p></div>;
  return <form method="post" className="form-panel programming-interest-form" onSubmit={submit}>
    <h3>Érdekel a programozás?</h3><p className="muted small">Hagyd meg az elérhetőséged, és egyeztetünk a lehetőségekről.</p>
    {!applicationsEnabled && <div className="notice">Az érdeklődési űrlap még előkészítés alatt áll.</div>}
    {import.meta.env.DEV && <p className="dev-note">Helyi próba: tesztadatot használj. Az érdeklődést az adminfelület rögzíti.</p>}
    <fieldset disabled={busy}><div className="form-grid"><label>Név *<input name="name" required maxLength={120} autoComplete="name" placeholder="Teljes név" /></label><label>E-mail-cím *<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="pelda@email.hu" /></label></div>
      <label className="checkbox"><input name="privacy" type="checkbox" required /><span>Megismertem az <a href="/adatkezeles" target="_blank" rel="noopener">adatkezelési tájékoztatót</a>. *</span></label>
      <ErrorMessage text={error} /><button className="button" disabled={busy || !applicationsEnabled}>{busy ? 'Rögzítés…' : 'Érdekel a programozás'} <Arrow /></button>
    </fieldset>
  </form>;
}

export function Login() {
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError('');
    try { const user = await api<User>('/auth/login', json('POST', { email: formValue(form, 'email'), password: String(form.get('password') ?? '') })); resetCsrf(); window.location.assign(user.role === 'ADMIN' ? '/admin' : '/tanulo'); }
    catch (e) { setError(errorText(e)); setBusy(false); }
  }
  return <div className="container login-page"><div><div className="eyebrow"><span />Jó újra itt látni</div><h1>A következő lépés<br />itt vár rád.</h1><p className="lead">Órák, tananyagok és hasznos linkek.<br />Minden egy helyen.</p><div className="login-illustration" aria-hidden="true"><span>if</span> kíváncsiság:<br />&nbsp;&nbsp;<b>kezdjük_el()</b></div></div><form method="post" className="form-panel login-form" onSubmit={submit}><h2>Belépés</h2><p className="muted">Használd a szervezőktől kapott fiókodat.</p><label>E-mail-cím<input type="email" name="email" autoComplete="username" required maxLength={254} /></label><label>Jelszó<input type="password" name="password" autoComplete="current-password" required /></label><ErrorMessage text={error} /><button className="button full-width" disabled={busy}>{busy ? 'Belépés…' : 'Belépek'} <Arrow /></button><p className="small muted">Elakadtál a belépéssel? <a href="/kapcsolat">Keresd a szervezőket.</a></p><div className="form-divider" /><p className="small">Még nem jelentkeztél? <a href="/jelentkezes">Ismerd meg a felkészítőt.</a></p></form></div>;
}

export function Portal({ admin }: { admin: boolean }) {
  const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState(''), [logoutBusy, setLogoutBusy] = useState(false);
  useEffect(() => { api<User>('/auth/me').then(setUser).catch(e => { if (!(e instanceof ApiError && e.status === 401)) setError(errorText(e)); }).finally(() => setLoading(false)); }, []);
  async function logout() { setLogoutBusy(true); setError(''); try { await api('/auth/logout', { method: 'POST' }); resetCsrf(); window.location.assign('/belepes'); } catch (e) { setError(errorText(e)); setLogoutBusy(false); } }
  if (loading) return <div className="container page-content"><h1>{admin ? 'Adminisztráció' : 'Tanulói felület'}</h1><Loading /></div>;
  if (!user) return <div className="container page-content narrow"><div className="eyebrow">Saját felület</div><h1>Lépj be a folytatáshoz.</h1><p>Az órákat és a tananyagokat bejelentkezés után éred el.</p><ErrorMessage text={error} /><a href="/belepes" className="button">Tovább a belépéshez <Arrow /></a></div>;
  if (admin && user.role !== 'ADMIN') return <div className="container page-content narrow"><h1>Ehhez nincs hozzáférésed.</h1><p>Ez a felület a szervezők számára érhető el.</p><a href="/tanulo" className="button">A saját óráim <Arrow /></a></div>;
  return <div className="container portal"><div className="portal-top"><div><div className="eyebrow">{admin ? 'Szervezői felület' : 'Saját tanulói felületed'}</div><h1>{admin ? 'Minden egy helyen.' : `Szia, ${user.name.split(' ')[0]}!`}</h1><p className="muted">{admin ? 'Jelentkezések, órák és a csapatod.' : 'Itt találod az óráidat, a tananyagokat és a csatlakozási linkeket.'}</p></div><div className="portal-actions">{user.role === 'ADMIN' && <a className="button button-outline" href={admin ? '/tanulo' : '/admin'}>{admin ? 'Tanulói nézet' : 'Adminisztráció'}</a>}<button className="button button-outline" disabled={logoutBusy} onClick={logout}>{logoutBusy ? 'Kilépés…' : 'Kilépés'}</button></div></div><ErrorMessage text={error} />{admin ? <AdminPanel currentUser={user} /> : <StudentLessons />}</div>;
}

function StudentLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  function load() { setLoading(true); setError(''); api<Lesson[]>('/lessons').then(setLessons).catch(e => setError(errorText(e))).finally(() => setLoading(false)); }
  useEffect(load, []);
  return <section><div className="section-line"><h2>Az óráid</h2><span className="muted">{lessons.length} közzétett óra</span></div><ErrorMessage text={error} />{error && <button className="button button-outline" onClick={load}>Újrapróbálom</button>}{loading ? <Loading /> : !lessons.length && !error ? <Empty>Még nincs közzétett óra. Amint elérhető lesz egy tananyag, itt találod.</Empty> : <div className="lesson-list">{lessons.map((lesson, index) => { const meeting = safeMeetingUrl(lesson.meetingUrl); return <article className="lesson-card" key={lesson.id}><div className="lesson-number">{String(index + 1).padStart(2, '0')}</div><div className="lesson-content"><span className="lesson-date"><Icon kind="calendar" />{formatDate(lesson.startsAt)}</span><h3>{lesson.title}</h3>{lesson.description && <p className="preserve-lines">{lesson.description}</p>}<div className="lesson-files">{lesson.files.map(file => <a className="file-link" href={`/api/files/${file.id}/download`} key={file.id}><Icon kind="file" /><span>{file.originalName}<small>{formatSize(file.size)}</small></span><span aria-hidden="true">↓</span></a>)}{!lesson.files.length && <p className="small muted">Ehhez az órához még nincs feltöltött fájl.</p>}</div>{meeting && <a className="button button-outline" href={meeting} target="_blank" rel="noopener noreferrer">Csatlakozás az órához <Arrow diagonal /></a>}</div></article>; })}</div>}</section>;
}
const formatSize = (size: number) => size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
type Tab = 'applications' | 'programming' | 'lessons' | 'users' | 'audit';
function AdminPanel({ currentUser }: { currentUser: User }) {
  const [tab, setTab] = useState<Tab>('applications');
  const tabs: [Tab, string][] = [['applications', 'Jelentkezések'], ['programming', 'Programozós érdeklődők'], ['lessons', 'Órák és anyagok'], ['users', 'Felhasználók'], ['audit', 'Eseménynapló']];
  return <><div className="admin-tabs" role="tablist" aria-label="Adminisztráció részei">{tabs.map(([value, label]) => <button role="tab" aria-selected={tab === value} aria-controls={`panel-${value}`} id={`tab-${value}`} key={value} onClick={() => setTab(value)}>{label}</button>)}</div><div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>{tab === 'applications' ? <ApplicationsAdmin /> : tab === 'programming' ? <ProgrammingInterestsAdmin /> : tab === 'lessons' ? <LessonsAdmin /> : tab === 'users' ? <UsersAdmin currentUser={currentUser} /> : <AuditAdmin />}</div></>;
}
const statuses: Record<ApplicationStatus, string> = { NEW: 'Új', CONTACTED: 'Kapcsolatfelvétel', ACCEPTED: 'Elfogadva', REJECTED: 'Elutasítva' };
function ApplicationsAdmin() {
  const [items, setItems] = useState<Application[]>([]), [courses, setCourses] = useState<Course[]>([]);
  const [filter, setFilter] = useState('ALL'), [courseFilter, setCourseFilter] = useState('ALL'), [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Application | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  async function load() {
    setLoading(true); setError('');
    try {
      const [applications, courseList] = await Promise.all([api<Application[]>('/admin/applications'), api<Course[]>('/courses')]);
      setItems(applications); setCourses(courseList);
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || busy) return;
    const form = new FormData(event.currentTarget); setBusy(true); setError(''); setSuccess('');
    try {
      // Only mutable workflow fields are sent. Original timestamps, group and prices stay server-owned.
      await api(`/admin/applications/${selected.id}`, json('PATCH', { status: formValue(form, 'status'), notes: formValue(form, 'notes') }));
      setSelected(null); setSuccess('A jelentkezés módosításait mentettük.'); await load();
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  const visible = items.filter(item => (filter === 'ALL' || item.status === filter)
    && (courseFilter === 'ALL' || (courseFilter === 'LEGACY' ? item.courseId == null : item.courseId === Number(courseFilter)))
    && `${item.studentName} ${item.email}`.toLocaleLowerCase('hu').includes(search.toLocaleLowerCase('hu')));
  return <>
    <div className="section-line"><h2>Beérkezett jelentkezések</h2><span className="muted">Összesen {items.length}</span></div>
    <div className="admin-course-summary" aria-label="Elfogadott jelentkezések csoportonként">{courses.map(course => <div key={course.id}><strong>{course.name}</strong><span>{course.acceptedCount} / {course.capacity} elfogadott</span><small>{courseTime(course)} · {course.availableSeats} szabad hely</small></div>)}</div>
    <div className="filters application-filters">
      <label>Keresés<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Név vagy e-mail-cím" /></label>
      <label>Csoport<select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}><option value="ALL">Minden csoport</option>{courses.map(course => <option key={course.id} value={course.id}>{course.name}</option>)}<option value="LEGACY">Korábbi, csoport nélküli</option></select></label>
      <label>Állapot<select value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">Összes állapot</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="button button-outline" disabled={loading || busy} onClick={() => void load()}>Frissítés</button>
    </div>
    <ErrorMessage text={error} /><Success text={success} />
    {selected && <form method="post" className="form-panel edit-panel" key={selected.id} onSubmit={save}>
      <div className="section-line"><h3>{selected.studentName}</h3><button type="button" className="text-button" disabled={busy} onClick={() => setSelected(null)}>Bezárás ×</button></div>
      <dl className="record-details">
        <dt>Jelentkezés időpontja</dt><dd><time dateTime={selected.createdAt}>{formatDate(selected.createdAt)}</time> <small className="muted">(budapesti idő, nem módosítható)</small></dd>
        <dt>Csoport</dt><dd>{selected.courseName || 'Korábbi jelentkezés – nincs csoporthoz rendelve'}</dd>
        <dt>E-mail</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd><dt>Telefon</dt><dd>{selected.phone}</dd><dt>Szülő / gondviselő</dt><dd>{selected.parentName || 'Nincs megadva'}</dd>
        <dt>Rögzített díj</dt><dd>{selected.quotedTotal != null ? <><PriceDisplay total={selected.quotedTotal} baseTotal={selected.baseTotal} perLesson={selected.quotedPerLesson} compact />{selected.discountPercent != null && <div className="small muted">Összes kedvezmény: {selected.discountPercent}%{selected.discountLabel && ` · ${selected.discountLabel}`}</div>}{selected.periodDiscountPercent != null && <div className="small muted">Korai kedvezmény: {selected.periodDiscountPercent}% · baráti kedvezmény: {selected.friendDiscountPercent ?? 0}% · összesen legfeljebb 35%.</div>}</> : 'Korábbi jelentkezés – nincs mentett árajánlat'}</dd>
        <dt>Baráti kedvezmény</dt><dd>{selected.friendCount > 0 || selected.referredByFriend ? <>{selected.friendCount > 0 && <>{selected.friendCount} barátot hoz. </>}{selected.referredByFriend && <>Barát ajánlásával érkezik. </>}<div className="small muted">A jogosultságot egyeztetni kell. A rögzített kedvezmény és díj a beküldéskori számítást őrzi.</div></> : 'Nem igényelte'}</dd>
        {selected.referralNote && <><dt>Baráti megjegyzés</dt><dd className="preserve-lines">{selected.referralNote}</dd></>}
        <dt>Laptopbérlés</dt><dd>{selected.laptopRentalRequested ? 'Igényli – díj és rendelkezésre állás egyeztetendő' : 'Nem igényli'}</dd>
        <dt>Üzenet</dt><dd className="preserve-lines">{selected.message || 'Nincs üzenet'}</dd>
      </dl>
      <div className="form-grid"><label>Állapot<select name="status" defaultValue={selected.status} disabled={busy}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Belső megjegyzés<textarea name="notes" rows={3} maxLength={4000} defaultValue={selected.notes ?? ''} disabled={busy} /></label></div>
      <button className="button" disabled={busy}>{busy ? 'Mentés…' : 'Módosítások mentése'}</button>
    </form>}
    {loading ? <Loading /> : visible.length ? <div className="table-wrap"><table><caption className="sr-only">Jelentkezések listája, az időpontok budapesti idő szerint</caption><thead><tr><th>Tanuló</th><th>Csoport</th><th>Beküldve</th><th>Rögzített díj</th><th>Állapot</th><th><span className="sr-only">Művelet</span></th></tr></thead><tbody>{visible.map(item => <tr key={item.id}>
      <td><strong>{item.studentName}</strong><small>{item.email}</small><small>{item.phone}</small></td><td>{item.courseName || 'Csoport nélküli'}{item.friendCount > 0 && <small>{item.friendCount} barát · egyeztetendő</small>}{item.referredByFriend && <small>Barát ajánlásával</small>}{item.laptopRentalRequested && <small>Laptopot igényel</small>}</td><td><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></td><td>{item.quotedTotal != null ? formatMoney(item.quotedTotal) : 'Nincs mentett ár'}</td><td><span className={`status status-${item.status.toLowerCase()}`}>{statuses[item.status]}</span></td><td><button className="text-button" onClick={() => { setSelected(item); setSuccess(''); }}>Megnyitás ↗</button></td>
    </tr>)}</tbody></table></div> : !error && <Empty>{items.length ? 'Nincs a szűrésnek megfelelő jelentkezés.' : 'Még nem érkezett jelentkezés.'}</Empty>}
  </>;
}

const interestStatuses: Record<InterestStatus, string> = { NEW: 'Új', CONTACTED: 'Kapcsolatfelvétel', COMPLETED: 'Lezárva' };
function ProgrammingInterestsAdmin() {
  const [items, setItems] = useState<ProgrammingInterest[]>([]), [selected, setSelected] = useState<ProgrammingInterest | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [filter, setFilter] = useState('ALL'), [error, setError] = useState(''), [success, setSuccess] = useState('');
  async function load() {
    setLoading(true); setError('');
    try { setItems(await api<ProgrammingInterest[]>('/admin/programming-interests')); }
    catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selected || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(''); setSuccess('');
    try {
      const updated = await api<ProgrammingInterest>(`/admin/programming-interests/${selected.id}`, json('PATCH', { status: formValue(form, 'status'), notes: formValue(form, 'notes') }));
      setItems(current => current.map(item => item.id === updated.id ? updated : item));
      setSelected(null); setSuccess('Az érdeklődés állapotát és megjegyzését mentettük.');
    } catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  const visible = items.filter(item => filter === 'ALL' || item.status === filter);
  return <>
    <div className="section-line"><div><h2>Programozós érdeklődők</h2><p className="muted small">Összesen {items.length} érdeklődés. A kapcsolatfelvételt a szervezők intézik.</p></div><button className="button button-outline" disabled={loading || busy} onClick={() => void load()}>Frissítés</button></div>
    <div className="filters"><label>Állapot<select value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">Minden érdeklődés</option>{Object.entries(interestStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <ErrorMessage text={error} /><Success text={success} />
    {selected && <form method="post" className="form-panel edit-panel" onSubmit={save} key={selected.id}>
      <div className="section-line"><h3>{selected.name}</h3><button type="button" className="text-button" disabled={busy} onClick={() => setSelected(null)}>Bezárás ×</button></div>
      <dl className="record-details"><dt>E-mail</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd><dt>Érkezett</dt><dd><time dateTime={selected.createdAt}>{formatDate(selected.createdAt)}</time> <small className="muted">(budapesti idő)</small></dd><dt>Utoljára módosítva</dt><dd>{formatDate(selected.updatedAt)}</dd></dl>
      <div className="form-grid"><label>Állapot<select name="status" defaultValue={selected.status} disabled={busy}>{Object.entries(interestStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Belső megjegyzés<textarea name="notes" rows={4} maxLength={4000} defaultValue={selected.notes ?? ''} disabled={busy} placeholder="Kapcsolatfelvétel, egyeztetett következő lépés…" /></label></div>
      <button className="button" disabled={busy}>{busy ? 'Mentés…' : 'Módosítások mentése'}</button>
    </form>}
    {loading ? <Loading /> : visible.length ? <div className="table-wrap"><table><caption className="sr-only">Programozós érdeklődők és a kézi kapcsolatfelvétel állapota</caption><thead><tr><th>Név</th><th>E-mail</th><th>Érkezett</th><th>Állapot</th><th><span className="sr-only">Művelet</span></th></tr></thead><tbody>{visible.map(item => <tr key={item.id}>
      <td><strong>{item.name}</strong></td><td><a href={`mailto:${item.email}`}>{item.email}</a></td><td><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></td><td><span className={`status status-${item.status === 'COMPLETED' ? 'accepted' : item.status.toLowerCase()}`}>{interestStatuses[item.status]}</span></td><td><button type="button" className="text-button" onClick={() => { setSelected(item); setSuccess(''); }}>Megnyitás ↗</button></td>
    </tr>)}</tbody></table></div> : !error && <Empty>{items.length ? 'Nincs a szűrésnek megfelelő érdeklődés.' : 'Még nem érkezett programozós érdeklődés.'}</Empty>}
  </>;
}
function UsersAdmin({ currentUser }: { currentUser: User }) {
  const [items, setItems] = useState<User[]>([]), [editing, setEditing] = useState<User | 'new' | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('');
  function load() { setLoading(true); api<User[]>('/admin/users').then(setItems).catch(e => setError(errorText(e))).finally(() => setLoading(false)); }
  useEffect(load, []);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!editing) return; const form = new FormData(event.currentTarget), password = String(form.get('password') ?? ''); setBusy(true); setError(''); setSuccess(''); const data = { name: formValue(form, 'name'), email: formValue(form, 'email'), role: formValue(form, 'role') as Role, enabled: form.get('enabled') === 'on', ...(password ? { password } : {}) }; try { await api(editing === 'new' ? '/admin/users' : `/admin/users/${editing.id}`, json(editing === 'new' ? 'POST' : 'PATCH', data)); setEditing(null); setSuccess('A felhasználó adatait mentettük.'); load(); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } }
  const selected = editing && editing !== 'new' ? editing : null;
  return <><div className="section-line"><h2>Felhasználók</h2><button className="button" onClick={() => { setEditing('new'); setSuccess(''); }}>+ Új felhasználó</button></div><ErrorMessage text={error} /><Success text={success} />{editing && <form method="post" className="form-panel edit-panel" onSubmit={save} key={selected?.id ?? 'new'}><div className="section-line"><h3>{selected ? 'Felhasználó szerkesztése' : 'Új felhasználó'}</h3><button type="button" className="text-button" disabled={busy} onClick={() => setEditing(null)}>Bezárás ×</button></div><div className="form-grid"><label>Név *<input name="name" required maxLength={120} defaultValue={selected?.name} /></label><label>E-mail-cím *<input name="email" type="email" required maxLength={254} defaultValue={selected?.email} autoComplete="off" /></label><label>Szerepkör<select name="role" defaultValue={selected?.role ?? 'STUDENT'}><option value="STUDENT">Tanuló</option><option value="ADMIN">Adminisztrátor</option></select></label><label>{selected ? 'Új jelszó (üresen: változatlan)' : 'Kezdeti jelszó *'}<input name="password" type="password" minLength={12} maxLength={72} required={!selected} autoComplete="new-password" /><small className="muted">Legalább 12 karakter.</small></label></div><label className="checkbox"><input type="checkbox" name="enabled" defaultChecked={selected?.enabled ?? true} /><span>Aktív fiók</span></label>{selected?.id === currentUser.id && <div className="notice">Saját fiókodat szerkeszted. Az adminisztrátori hozzáférés védelmét a szerver ellenőrzi.</div>}<button className="button" disabled={busy}>{busy ? 'Mentés…' : 'Felhasználó mentése'}</button></form>}{loading ? <Loading /> : <div className="table-wrap"><table><caption className="sr-only">Felhasználók listája</caption><thead><tr><th>Név</th><th>E-mail-cím</th><th>Szerepkör</th><th>Állapot</th><th><span className="sr-only">Művelet</span></th></tr></thead><tbody>{items.map(user => <tr key={user.id}><td><strong>{user.name}</strong>{user.id === currentUser.id && <small>Saját fiók</small>}</td><td>{user.email}</td><td>{user.role === 'ADMIN' ? 'Adminisztrátor' : 'Tanuló'}</td><td><span className={`status ${user.enabled ? 'status-accepted' : ''}`}>{user.enabled ? 'Aktív' : 'Letiltva'}</span></td><td><button className="text-button" onClick={() => { setEditing(user); setSuccess(''); }}>Szerkesztés ↗</button></td></tr>)}</tbody></table></div>}</>;
}

function LessonsAdmin() {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  async function removeLesson() {
    if (!editing || editing === 'new') return;
    setBusy(true); setError(''); setSuccess('');
    try {
      await api(`/admin/lessons/${editing.id}`, { method: 'DELETE' });
      setEditing(null); setDeleteConfirm(false); setSuccess('Az órát és a csatolt fájljait töröltük.'); await load();
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  const [items, setItems] = useState<Lesson[]>([]), [editing, setEditing] = useState<Lesson | 'new' | null>(null), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState(''), [removing, setRemoving] = useState<number | null>(null);
  async function load() { setLoading(true); try { const data = await api<Lesson[]>('/admin/lessons'); setItems(data); return data; } catch (e) { setError(errorText(e)); return []; } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!editing) return; const form = new FormData(event.currentTarget); const meetingUrl = formValue(form, 'meetingUrl'); if (meetingUrl && !safeMeetingUrl(meetingUrl)) { setError('Az értekezlet linkjének https:// kezdetű URL-nek kell lennie.'); return; } setBusy(true); setError(''); setSuccess(''); try { const lesson = await api<Lesson>(editing === 'new' ? '/admin/lessons' : `/admin/lessons/${editing.id}`, json(editing === 'new' ? 'POST' : 'PUT', { title: formValue(form, 'title'), description: formValue(form, 'description'), startsAt: formValue(form, 'startsAt') || null, meetingUrl: meetingUrl || null, published: form.get('published') === 'on' })); setEditing(lesson); setDeleteConfirm(false); setSuccess('Az órát mentettük. A fájlokat lent csatolhatod.'); await load(); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } }
  async function upload(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!editing || editing === 'new') return; const formElement = event.currentTarget, form = new FormData(formElement), file = form.get('file'); if (!(file instanceof File) || !file.size) return; if (file.size > 20 * 1024 * 1024) { setError('A feltölthető fájl legfeljebb 20 MB lehet.'); return; } setBusy(true); setError(''); setSuccess(''); try { await api(`/admin/lessons/${editing.id}/files`, { method: 'POST', body: form }); const data = await load(); setEditing(data.find(item => item.id === editing.id) ?? null); formElement.reset(); setSuccess('A fájlt feltöltöttük.'); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } }
  async function removeFile(id: number) { if (!editing || editing === 'new') return; setBusy(true); setError(''); setSuccess(''); try { await api(`/admin/files/${id}`, { method: 'DELETE' }); const data = await load(); setEditing(data.find(item => item.id === editing.id) ?? null); setRemoving(null); setSuccess('A fájlt töröltük.'); } catch (e) { setError(errorText(e)); } finally { setBusy(false); } }
  const selected = editing && editing !== 'new' ? editing : null;
  return <><div className="section-line"><h2>Órák és tananyagok</h2><button className="button" onClick={() => { setEditing('new'); setSuccess(''); setRemoving(null); }}>+ Új óra</button></div><ErrorMessage text={error} /><Success text={success} />{editing && <div className="form-panel edit-panel"><form method="post" onSubmit={save} key={selected?.id ?? 'new'}><div className="section-line"><h3>{selected ? 'Óra szerkesztése' : 'Új óra létrehozása'}</h3><button type="button" className="text-button" disabled={busy} onClick={() => setEditing(null)}>Bezárás ×</button></div><div className="form-grid"><label>Óra neve *<input name="title" required maxLength={160} defaultValue={selected?.title} placeholder="Pl. 1. óra – Ismerkedés az alapokkal" /></label><label>Időpont (budapesti helyi idő)<input name="startsAt" type="datetime-local" defaultValue={selected?.startsAt?.slice(0, 16) ?? ''} /></label></div><label>Rövid leírás<textarea name="description" rows={3} maxLength={6000} defaultValue={selected?.description} /></label><label>Online értekezlet linkje<input name="meetingUrl" type="url" maxLength={2048} defaultValue={selected?.meetingUrl ?? ''} placeholder="https://teams.microsoft.com/…" /></label><label className="checkbox"><input type="checkbox" name="published" defaultChecked={selected?.published ?? false} /><span>Közzétéve – látható a tanulóknak</span></label><button className="button" disabled={busy}>{busy ? 'Mentés…' : 'Óra mentése'}</button></form>{selected && <div className="upload-section"><div className="section-line"><h3>Csatolt fájlok</h3><button type="button" className="text-button danger" disabled={busy} onClick={() => setDeleteConfirm(!deleteConfirm)}>Óra törlése</button></div>{deleteConfirm && <div className="notice">Az óra és minden csatolt fájl végleg törlődik. <button type="button" className="text-button danger" disabled={busy} onClick={removeLesson}>Végleges törlés</button> <button type="button" className="text-button" onClick={() => setDeleteConfirm(false)}>Mégsem</button></div>}{selected.files.length ? <ul className="admin-file-list">{selected.files.map(file => <li key={file.id}><a href={`/api/files/${file.id}/download`}>{file.originalName} <small>({formatSize(file.size)})</small></a>{removing === file.id ? <span className="confirm-delete">Biztosan törlöd? <button type="button" className="text-button danger" disabled={busy} onClick={() => removeFile(file.id)}>Igen</button><button type="button" className="text-button" disabled={busy} onClick={() => setRemoving(null)}>Mégsem</button></span> : <button type="button" className="text-button danger" onClick={() => setRemoving(file.id)}>Törlés</button>}</li>)}</ul> : <p className="muted">Még nincs csatolt fájl.</p>}<form method="post" onSubmit={upload} className="upload-form"><label>Új fájl (legfeljebb 20 MB)<input type="file" name="file" required /></label><button className="button button-outline" disabled={busy}>{busy ? 'Folyamatban…' : 'Fájl feltöltése'}</button></form></div>}</div>}{loading ? <Loading /> : !items.length ? <Empty>Még nincs létrehozott óra. Az „Új óra” gombbal kezdhetsz.</Empty> : <div className="table-wrap"><table><caption className="sr-only">Órák listája</caption><thead><tr><th>Óra</th><th>Időpont</th><th>Anyagok</th><th>Állapot</th><th><span className="sr-only">Művelet</span></th></tr></thead><tbody>{items.map(lesson => <tr key={lesson.id}><td><strong>{lesson.title}</strong></td><td>{formatDate(lesson.startsAt)}</td><td>{lesson.files.length} fájl</td><td><span className={`status ${lesson.published ? 'status-accepted' : ''}`}>{lesson.published ? 'Közzétéve' : 'Piszkozat'}</span></td><td><button className="text-button" onClick={() => { setEditing(lesson); setDeleteConfirm(false); setSuccess(''); setRemoving(null); }}>Szerkesztés ↗</button></td></tr>)}</tbody></table></div>}</>;
}
function AuditAdmin() {
  const [items, setItems] = useState<Audit[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState('');
  function load() { setLoading(true); setError(''); api<Audit[]>('/admin/audit').then(setItems).catch(e => setError(errorText(e))).finally(() => setLoading(false)); }
  useEffect(load, []);
  return <><div className="section-line"><div><h2>Eseménynapló</h2><p className="muted small">A legutóbbi adminisztrációs és bejelentkezési események.</p></div><button className="button button-outline" onClick={load}>Frissítés</button></div><ErrorMessage text={error} />{loading ? <Loading /> : !items.length ? <Empty>Még nincs megjeleníthető esemény.</Empty> : <div className="table-wrap"><table><caption className="sr-only">Naplózott események</caption><thead><tr><th>Időpont</th><th>Felhasználó</th><th>Művelet</th><th>Érintett elem</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{formatDate(item.createdAt)}</td><td>{item.actor}</td><td><code>{item.action}</code></td><td>{item.target}</td></tr>)}</tbody></table></div>}</>;
}
