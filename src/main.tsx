import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { pages, origin } from './seo';
import './fonts.css';
import './styles.css';
const path = window.location.pathname.replace(/\/$/, '') || '/';
const root = document.getElementById('root')!;
const app = <App path={path} />;
// The development shell contains an HTML comment, which is not prerendered content.
if (root.children.length > 0) hydrateRoot(root, app); else createRoot(root).render(app);
// Vite development serves a single shell; production metadata is already prerendered.
if (import.meta.env.DEV) {
  const page = pages[path];
  document.title = page?.title ?? 'Az oldal nem található | diku.';
  const description = document.createElement('meta'); description.name = 'description'; description.content = page?.description ?? ''; document.head.append(description);
  const canonical = document.createElement('link'); canonical.rel = 'canonical'; canonical.href = `${origin}${path === '/' ? '' : path}`; document.head.append(canonical);
  const robots = document.createElement('meta'); robots.name = 'robots'; robots.content = 'noindex, nofollow'; document.head.append(robots);
}
