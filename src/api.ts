let csrf: { token: string; headerName: string } | null = null;
export class ApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
export function resetCsrf() { csrf = null; }
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = init.method ?? 'GET';
  const headers = new Headers(init.headers);
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!csrf) {
      let response: Response;
      try { response = await fetch('/api/auth/csrf', { credentials: 'include' }); }
      catch { throw new ApiError('A szerver jelenleg nem érhető el. Próbáld újra később.', 0); }
      if (!response.ok) throw new ApiError('A szerver jelenleg nem érhető el. Próbáld újra később.', response.status);
      csrf = await response.json();
    }
    if (csrf) headers.set(csrf.headerName, csrf.token);
    if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  }
  let response: Response;
  try { response = await fetch(`/api${path}`, { ...init, headers, credentials: 'include' }); }
  catch { throw new ApiError('Nem sikerült kapcsolódni a szerverhez. Ellenőrizd a kapcsolatot, majd próbáld újra.', 0); }
  if (!response.ok) {
    const fallback = response.status === 401 ? 'A bejelentkezés szükséges, vagy a megadott adatok hibásak.' : response.status === 403 ? 'Nincs jogosultságod ehhez a művelethez. Jelentkezz be újra.' : response.status === 413 ? 'A fájl túl nagy. A megengedett méret legfeljebb 20 MB.' : 'A művelet nem sikerült. Kérjük, próbáld újra.';
    const problem = await response.json().catch(() => null);
    throw new ApiError(problem?.detail || problem?.message || fallback, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}
export const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });
export const errorText = (error: unknown) => error instanceof Error ? error.message : 'Váratlan hiba történt.';
export const formatMoney = (value: number) => `${new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2, useGrouping: true }).format(value)} Ft`;
export const formatCourseDate = (date: string) => {
  const parsed = new Date(`${date}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat('hu-HU', { dateStyle: 'long', timeZone: 'UTC' }).format(parsed);
};
export const formatDate = (date: string | null) => {
  if (!date) return 'Időpont egyeztetés alatt';
  // LocalDateTime values represent Budapest wall time; do not reinterpret in the viewer's zone.
  const isWallTime = !/(Z|[+-]\d{2}:\d{2})$/.test(date);
  const parsed = new Date(isWallTime ? `${date}Z` : date);
  if (Number.isNaN(parsed.getTime())) return 'Ismeretlen időpont';
  return new Intl.DateTimeFormat('hu-HU', { dateStyle: 'medium', timeStyle: 'short', timeZone: isWallTime ? 'UTC' : 'Europe/Budapest' }).format(parsed);
};
export const safeMeetingUrl = (url: string | null) => { try { const parsed = new URL(url || ''); return parsed.protocol === 'https:' ? parsed.href : null; } catch { return null; } };
