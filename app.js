/* ============================================================
   Omar Hamzat — portfolio behaviour
   Vanilla JS, no dependencies. Pulls repos from the GitHub API,
   caches them for an hour, and falls back to a bundled snapshot
   if the API is unreachable or rate-limited.
   ============================================================ */

const USERNAME = 'Omar-Hamzat';
const API = `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`;
const CACHE_KEY = 'gh-repos-v1';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour — keeps us well inside the 60 req/hr limit

/* Repos to hide from the grid (e.g. the portfolio repo itself). */
const HIDDEN = new Set([`${USERNAME.toLowerCase()}.github.io`]);

/* Friendlier titles / descriptions than the raw repo metadata.
   Keyed by lowercase repo name. Anything not listed falls back to GitHub's own data. */
const OVERRIDES = {
  'e-commerce-application': {
    title: 'E-Commerce Application',
    desc: 'A full-stack online storefront built in Java — product catalogue, cart and order flow.'
  },
  'finance-news-ticker': {
    title: 'Finance News Ticker',
    desc: 'A live scrolling ticker that pulls market headlines and renders them in the browser.'
  },
  'fitness-application': {
    title: 'Fitness Application',
    desc: 'A workout and progress tracker with a responsive web front end.'
  },
  'card-match-game': {
    title: 'Card Match Game',
    desc: 'A memory matching game built with HTML, CSS and JavaScript.'
  }
};

/* Projects that don't live under my own account (team repos, capstones) and so
   never come back from the API call above. Same shape as a GitHub repo object,
   plus `title`, `desc`, `role` and `badge`. Add to this list by hand. */
const EXTRA_PROJECTS = [
  {
    name: 'capstone-CUVision-master',
    title: 'CUVision — Autonomous Driving Perception',
    desc: 'A real-time perception stack for self-driving: road and lane segmentation plus traffic-sign recognition, running end-to-end against live camera feeds and the CARLA simulator.',
    role: 'My role: ROS 2 integration — wiring the perception models into a multi-node real-time pipeline.',
    badge: 'Capstone',
    featured: true,
    language: 'Python',
    html_url: 'https://github.com/anochronos/capstone-CUVision-master',
    homepage: null,
    stargazers_count: 0,
    forks_count: 0,
    topics: ['ros2', 'computer-vision', 'autonomous-driving', 'pytorch', 'yolo', 'carla', 'segmentation'],
    created_at: '2026-04-22T04:58:49Z',
    pushed_at: '2026-04-22T05:13:49Z',
    fork: false,
    archived: false
  }
];

/* Minimal offline snapshot so the page is never empty. */
const FALLBACK = [
  { name: 'E-Commerce-Application', description: null, language: 'Java', stargazers_count: 0, forks_count: 0, html_url: `https://github.com/${USERNAME}/E-Commerce-Application`, homepage: null, pushed_at: '2026-06-09T01:26:59Z', created_at: '2026-03-09T15:07:11Z', topics: [], fork: false, archived: false },
  { name: 'Finance-News-Ticker', description: null, language: 'HTML', stargazers_count: 0, forks_count: 0, html_url: `https://github.com/${USERNAME}/Finance-News-Ticker`, homepage: null, pushed_at: '2026-02-18T15:09:05Z', created_at: '2026-02-17T02:27:10Z', topics: [], fork: false, archived: false },
  { name: 'FITNESS-APPLICATION', description: null, language: 'HTML', stargazers_count: 0, forks_count: 0, html_url: `https://github.com/${USERNAME}/FITNESS-APPLICATION`, homepage: null, pushed_at: '2024-05-14T09:36:39Z', created_at: '2024-04-13T15:34:47Z', topics: [], fork: false, archived: false },
  { name: 'Card-Match-Game', description: 'Uses HTML, CSS AND Javascript to create a matching game', language: 'JavaScript', stargazers_count: 0, forks_count: 0, html_url: `https://github.com/${USERNAME}/Card-Match-Game`, homepage: null, pushed_at: '2023-04-03T20:38:17Z', created_at: '2023-04-03T17:23:31Z', topics: [], fork: false, archived: false }
];

/* GitHub's own language colours, for the little dots. */
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Java: '#b07219', HTML: '#e34c26',
  CSS: '#563d7c', Python: '#3572A5', 'C#': '#178600', 'C++': '#f34b7d', C: '#555555',
  Shell: '#89e051', Kotlin: '#A97BFF', Swift: '#F05138', Go: '#00ADD8', Rust: '#dea584',
  PHP: '#4F5D95', Ruby: '#701516', Dart: '#00B4AB', Vue: '#41b883', 'Jupyter Notebook': '#DA5B0B'
};

const $ = (sel) => document.querySelector(sel);

const state = { repos: [], lang: 'All', query: '', sort: 'updated' };

/* ------------------------------------------------------------
   Data
   ------------------------------------------------------------ */

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (!Array.isArray(data) || Date.now() - at > CACHE_TTL) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch { /* storage full or blocked — not important */ }
}

async function loadRepos() {
  const cached = readCache();
  if (cached) return { repos: cached, stale: false };

  try {
    const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`GitHub API responded ${res.status}`);
    const data = await res.json();
    writeCache(data);
    return { repos: data, stale: false };
  } catch (err) {
    console.warn('Falling back to bundled repo snapshot:', err.message);
    return { repos: FALLBACK, stale: true };
  }
}

/* ------------------------------------------------------------
   Rendering
   ------------------------------------------------------------ */

function timeAgo(iso) {
  const days = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = (days / 365).toFixed(1).replace('.0', '');
  return `${years} year${years === '1' ? '' : 's'} ago`;
}

function prettyName(repo) {
  if (repo.title) return repo.title;
  const o = OVERRIDES[repo.name.toLowerCase()];
  if (o?.title) return o.title;
  return repo.name.replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function description(repo) {
  if (repo.desc) return { text: repo.desc, placeholder: false };
  const o = OVERRIDES[repo.name.toLowerCase()];
  if (repo.description) return { text: repo.description, placeholder: false };
  if (o?.desc) return { text: o.desc, placeholder: false };
  return { text: 'No description yet — open the repo to see the code.', placeholder: true };
}

/* A repo counts as having a live demo if it declares a homepage. */
function demoUrl(repo) {
  const home = (repo.homepage || '').trim();
  return /^https?:\/\//.test(home) ? home : null;
}

function cardHtml(repo, index) {
  const { text, placeholder } = description(repo);
  const color = LANG_COLORS[repo.language] || '#8590a6';
  const demo = demoUrl(repo);
  const isNew = Date.now() - new Date(repo.created_at) < 90 * 86400000;

  let badge = '';
  if (repo.badge) badge = repo.badge;
  else if (repo.archived) badge = 'Archived';
  else if (isNew) badge = 'New';

  const num = String(index + 1).padStart(3, '0');

  return `
    <article class="card${repo.featured ? ' is-featured' : ''}" style="animation-delay:${Math.min(index * 45, 320)}ms">
      <div class="card-head">
        <span class="card-num" aria-hidden="true">${num}</span>
        <h3 class="card-title">
          <a href="${repo.html_url}" target="_blank" rel="noopener">${escapeHtml(prettyName(repo))}</a>
        </h3>
        ${badge ? `<span class="card-badge">${escapeHtml(badge)}</span>` : ''}
      </div>

      <p class="card-desc${placeholder ? ' is-placeholder' : ''}">${escapeHtml(text)}</p>
      ${repo.role ? `<p class="card-role">${escapeHtml(repo.role)}</p>` : ''}

      <div class="card-meta">
        ${repo.language ? `<span><i class="lang-dot" style="background:${color}"></i>${escapeHtml(repo.language)}</span>` : ''}
        ${repo.forks_count ? `<span title="Forks">⑂ ${repo.forks_count}</span>` : ''}
        <span title="Last push">Upd. ${timeAgo(repo.pushed_at || repo.updated_at)}</span>
      </div>

      <div class="card-links">
        <a class="card-link primary" href="${repo.html_url}" target="_blank" rel="noopener">View code &rarr;</a>
        ${demo ? `<a class="card-link" href="${demo}" target="_blank" rel="noopener">Live demo &rarr;</a>` : ''}
      </div>
    </article>`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function visibleRepos() {
  const q = state.query.toLowerCase();
  return state.repos
    .filter((r) => {
      if (state.lang !== 'All' && r.language !== state.lang) return false;
      if (!q) return true;
      const haystack = [r.name, prettyName(r), r.description, r.language, r.role,
                        ...(r.topics || []), description(r).text]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => {
      // Featured projects lead, whatever the chosen sort.
      if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
      switch (state.sort) {
        case 'name':    return prettyName(a).localeCompare(prettyName(b));
        case 'created': return new Date(b.created_at) - new Date(a.created_at);
        default:        return new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
      }
    });
}

function renderGrid() {
  const list = visibleRepos();
  const grid = $('#project-grid');
  const count = $('#result-count');

  grid.innerHTML = list.map(cardHtml).join('');
  $('#empty-state').hidden = list.length > 0;

  count.textContent = list.length
    ? `${list.length} of ${state.repos.length} shown`
    : '';
}

function renderFilters() {
  const langs = [...new Set(state.repos.map((r) => r.language).filter(Boolean))].sort();
  const wrap = $('#filters');

  wrap.innerHTML = ['All', ...langs].map((lang) => {
    const color = LANG_COLORS[lang];
    return `<button type="button" class="chip" data-lang="${escapeHtml(lang)}"
              aria-pressed="${lang === state.lang}">
              ${color ? `<i class="dot" style="background:${color}"></i>` : ''}${escapeHtml(lang)}
            </button>`;
  }).join('');

  wrap.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      state.lang = chip.dataset.lang;
      wrap.querySelectorAll('.chip').forEach((c) =>
        c.setAttribute('aria-pressed', String(c === chip)));
      renderGrid();
    });
  });
}

/* Animate a number up to its target. The final value is written first so the
   figure is still correct if rAF never runs (background tab, reduced motion). */
function countUp(el, target) {
  el.textContent = String(target);
  if (target === 0 || document.hidden ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const duration = 900;
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function renderStats() {
  const langs = new Set(state.repos.map((r) => r.language).filter(Boolean)).size;
  countUp($('#stat-repos'), state.repos.length);
  countUp($('#stat-langs'), langs);
}

/* ------------------------------------------------------------
   Theme
   ------------------------------------------------------------ */

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  setTheme(saved || (prefersLight ? 'light' : 'dark'));

  $('#theme-toggle').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });
}

/* The button is labelled with the theme it switches TO. */
function setTheme(theme) {
  const next = theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('theme', theme);

  const btn = $('#theme-toggle');
  btn.setAttribute('aria-label', `Switch to ${next} theme`);
  btn.querySelector('.theme-label').textContent = next === 'dark' ? 'Dark' : 'Light';
}

/* ------------------------------------------------------------
   Misc interactions
   ------------------------------------------------------------ */

function initControls() {
  let debounce;
  $('#search').addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      state.query = e.target.value.trim();
      renderGrid();
    }, 120);
  });

  $('#sort').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  // "/" focuses search, Escape clears it.
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (e.key === '/' && !typing) {
      e.preventDefault();
      $('#search').focus();
    } else if (e.key === 'Escape' && document.activeElement === $('#search')) {
      $('#search').value = '';
      state.query = '';
      renderGrid();
    }
  });

  $('#to-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */

async function main() {
  $('#year').textContent = new Date().getFullYear();
  initTheme();
  initControls();

  const { repos, stale } = await loadRepos();

  const mine = repos.filter((r) => !r.fork && !HIDDEN.has(r.name.toLowerCase()));
  const extraNames = new Set(EXTRA_PROJECTS.map((r) => r.name.toLowerCase()));

  // Curated entries win if a repo of the same name ever shows up under my account.
  state.repos = [...EXTRA_PROJECTS, ...mine.filter((r) => !extraNames.has(r.name.toLowerCase()))];

  renderStats();
  renderFilters();
  renderGrid();

  if (stale) {
    const el = $('#error-state');
    el.hidden = false;
    el.textContent = "Couldn't reach the GitHub API just now, so this is a saved snapshot. Refresh in a minute for the live list.";
  }
}

main();
