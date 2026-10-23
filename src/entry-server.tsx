import { renderToString } from 'react-dom/server';
import { App } from './App';
export { pages, publicPaths, seoMarkup, origin } from './seo';
export function render(path: string) { return renderToString(<App path={path} />); }
