#!/usr/bin/env node
/**
 * Build the Chore League website into _site/ (no dependencies — Node 18+).
 *
 *   node scripts/build.mjs          build + checks (fails on any problem)
 *
 * Pages live in src/pages/*.html with a one-line meta comment at the top:
 *   <!--meta {"title": "...", "description": "...", "path": "/x.html", "nav": "x"} -->
 * Every page gets the same head/header/footer (src/partials), so the nav,
 * footer and SEO tags can never drift between pages. Site-wide values come
 * from site.config.json; FAQ text from data/faq.json (rendered into the page
 * AND the FAQPage JSON-LD, from one source).
 *
 * Checks (the build fails if any fails): every internal link/asset exists,
 * no unfilled {{tokens}}, every page has a title + description, no inline
 * style="" (the CSP forbids it), and no leftover personal family names.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const faq = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/faq.json'), 'utf8'));
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const partial = { head: read('src/partials/head.html'), header: read('src/partials/header.html'), footer: read('src/partials/footer.html') };
const BUILD = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const TODAY = new Date().toISOString().slice(0, 10);
const errors = [];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ── Reusable blocks ──────────────────────────────────────────────────────────
function getButton(variant) {
  const cls = variant === 'light' ? 'btn btn-primary' : variant === 'small' ? 'btn btn-primary btn-sm' : 'btn btn-primary';
  if (config.launched && config.playUrl) {
    return `<a class="${cls}" href="${esc(config.playUrl)}" rel="noopener">Get it on Google Play</a>`;
  }
  // Before launch the CTA recruits closed-test families (Play needs 12+ testers).
  const mail = `mailto:${config.supportEmail}?subject=${encodeURIComponent('Chore League early access')}`;
  return `<a class="${cls}" href="${esc(mail)}">${variant === 'small' ? 'Early access' : 'Join the early test'}</a>`;
}

function screen(id, caption) {
  const img = `assets/img/screens/${id}.png`;
  if (exists(img)) {
    return `<div class="phone"><img src="{{root}}${img}" alt="${esc(caption)}" width="1080" height="2340" loading="lazy" decoding="async"></div>`;
  }
  return `<div class="phone"><div class="ph" role="img" aria-label="${esc(caption)} (screenshot coming soon)"><div><img src="{{root}}assets/img/brand/chest-3d.png" alt="" width="96" height="96">${esc(caption)}<small>Screenshot coming soon</small></div></div></div>`;
}

function demoVideo() {
  if (exists('assets/video/demo.mp4')) {
    const poster = exists('assets/img/screens/demo-poster.jpg') ? ' poster="{{root}}assets/img/screens/demo-poster.jpg"' : '';
    return `<video controls playsinline preload="none"${poster}><source src="{{root}}assets/video/demo.mp4" type="video/mp4">Your browser can't play this video.</video>`;
  }
  return `<div class="ph" role="img" aria-label="Product demo video coming soon"><div><img src="{{root}}assets/img/brand/chest-3d.png" alt="" width="96" height="96">Product demo<small>Video coming soon</small></div></div>`;
}

const faqHtml = faq.map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n');
const faqJsonLd = `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
})}</script>`;
const appJsonLd = `<script type="application/ld+json">${JSON.stringify({
  '@context': 'https://schema.org', '@type': 'MobileApplication', name: config.name, operatingSystem: 'Android',
  applicationCategory: 'LifestyleApplication', description: config.description, url: config.url,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  publisher: { '@type': 'Organization', name: config.company, url: config.companyUrl },
  ...(config.launched && config.playUrl ? { sameAs: [config.playUrl] } : {}),
})}</script>`;

// ── Pages ────────────────────────────────────────────────────────────────────
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const pages = [];
const NAV_KEYS = ['features', 'guide', 'families', 'support'];

for (const file of fs.readdirSync(path.join(ROOT, 'src/pages')).filter((f) => f.endsWith('.html'))) {
  const raw = read(`src/pages/${file}`);
  const m = raw.match(/^<!--meta (\{.*\}) -->\r?\n/);
  if (!m) { errors.push(`${file}: missing <!--meta {...} --> line`); continue; }
  const meta = JSON.parse(m[1]);
  if (!meta.title || !meta.description || !meta.path) errors.push(`${file}: meta needs title, description and path`);
  const body = raw.slice(m[0].length);
  const jsonld = [meta.appJsonLd ? appJsonLd : '', meta.faqJsonLd ? faqJsonLd : '', meta.noindex ? '<meta name="robots" content="noindex">' : ''].join('\n');

  let html = partial.head + partial.header + body + partial.footer;
  html = html
    .replace(/\{\{screen:([a-z0-9-]+)\|([^}]+)\}\}/g, (_, id, cap) => screen(id, cap))
    .replace(/\{\{demoVideo\}\}/g, demoVideo())
    .replace(/\{\{faq\}\}/g, faqHtml)
    .replace(/\{\{getButton\}\}/g, getButton())
    .replace(/\{\{getButtonLight\}\}/g, getButton('light'))
    .replace(/\{\{getButtonSmall\}\}/g, getButton('small'))
    .replace(/\{\{page\.jsonld\}\}/g, jsonld)
    .replace(/\{\{page\.(title|description|path)\}\}/g, (_, k) => esc(meta[k]))
    .replace(/\{\{nav\.([a-z]+)\}\}/g, (_, k) => (meta.nav === k ? 'aria-current="page"' : ''))
    .replace(/\{\{config\.([a-zA-Z]+)\}\}/g, (_, k) => esc(config[k] ?? ''))
    .replace(/\{\{year\}\}/g, String(new Date().getFullYear()))
    .replace(/\{\{build\}\}/g, BUILD)
    .replace(/\{\{root\}\}/g, meta.absoluteRoot ? '/' : '');

  // Checks
  const leftover = html.match(/\{\{[^}]*\}\}/g);
  if (leftover) errors.push(`${file}: unfilled tokens ${[...new Set(leftover)].join(', ')}`);
  if (/\sstyle="/i.test(html)) errors.push(`${file}: inline style="" (blocked by the CSP — use a class)`);
  if (/\b(Rajwade|Vian|Vayu|Asmita|Sameer)\b/.test(html)) errors.push(`${file}: personal family name found — use generic names`);
  for (const [, attr, url] of html.matchAll(/\s(href|src|poster)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|tel:|#|data:)/.test(url)) continue;
    const clean = url.replace(/^\//, '').split('#')[0].split('?')[0];
    if (!clean) continue;
    if (!exists(clean) && !exists(`src/pages/${clean}`) && !['site.webmanifest', '.well-known/security.txt'].includes(clean)) {
      errors.push(`${file}: broken ${attr} → ${url}`);
    }
  }
  fs.writeFileSync(path.join(OUT, file), html);
  pages.push(meta);
}

// ── Static files ─────────────────────────────────────────────────────────────
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
  .filter((p) => !p.noindex)
  .sort((a, b) => a.path.localeCompare(b.path))
  .map((p) => `  <url><loc>${config.url}${p.path}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(OUT, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${config.url}/sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, 'CNAME'), `${config.domain}\n`);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
fs.writeFileSync(path.join(OUT, 'site.webmanifest'), JSON.stringify({
  name: config.name, short_name: config.name, start_url: '/', display: 'browser',
  background_color: '#F7F6FF', theme_color: config.themeColor,
  icons: [{ src: '/assets/img/brand/icon-512.png', sizes: '512x512', type: 'image/png' }],
}, null, 2));
const expires = new Date(Date.now() + 365 * 86_400_000).toISOString();
fs.mkdirSync(path.join(OUT, '.well-known'), { recursive: true });
fs.writeFileSync(path.join(OUT, '.well-known/security.txt'),
  `Contact: mailto:${config.securityEmail}\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${config.url}/.well-known/security.txt\nPolicy: ${config.url}/security.html\n`);

if (errors.length) {
  console.error(`\n✗ Build failed (${errors.length}):\n  - ${errors.join('\n  - ')}\n`);
  process.exit(1);
}
console.log(`✓ Built ${pages.length} pages into _site/ (${config.launched ? 'launched' : 'pre-launch: CTA = early-test signup'})`);
