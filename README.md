# Omar-Hamzat.github.io

My personal portfolio site — live at **https://omar-hamzat.github.io**

Plain HTML, CSS and JavaScript. No frameworks, no build step: GitHub Pages
serves these files directly.

## How it works

The projects section calls the public GitHub API
(`api.github.com/users/Omar-Hamzat/repos`) when the page loads, so **new repos
show up on the site automatically** — no need to edit anything here. Results are
cached in `localStorage` for an hour to stay well inside the API's 60-requests-per-hour
limit, and there's a bundled snapshot in `app.js` (`FALLBACK`) that renders if the
API is ever unreachable.

| File | Purpose |
| --- | --- |
| `index.html` | Page structure and all written copy |
| `styles.css` | Theme tokens (top of file), layout, dark/light themes |
| `app.js` | GitHub fetch, search/filter/sort, theme toggle, animations |
| `.vscode/` | Editor settings, tasks and debug config (committed on purpose) |
| `tools/` | Two small maintenance scripts — see the VS Code section |

## Editing it

- **About text, tagline, skills** — in `index.html`. The About paragraph is marked with an `EDIT ME` comment.
- **Colours** — the `:root` block at the top of `styles.css`; `--accent` and `--accent-2` drive most of the look.
- **Project descriptions** — most repos have no description on GitHub, so `app.js`
  has an `OVERRIDES` map keyed by lowercase repo name. Add an entry there, or (better)
  set the description on the repo itself on GitHub and it'll be picked up automatically.
- **Team projects I don't own** — repos under someone else's account never come back
  from the API, so they go in the `EXTRA_PROJECTS` array in `app.js` by hand. Each entry
  takes `title`, `desc`, `role` (rendered as a quoted line describing my contribution),
  `badge`, and `featured: true` to pin it to the top of the grid regardless of the
  chosen sort. Copy the CUVision entry as a template.
- **Live demo buttons** — a card shows a "Live demo" button when that repo has a
  **Website / homepage** URL set in its GitHub sidebar. Enable Pages on a project
  repo, paste the URL there, and the button appears.
- **Hiding a repo** — add its name to the `HIDDEN` set in `app.js`. Forks are hidden already.

## Working on it in VS Code

Open the folder in VS Code — `.vscode/` is committed, so settings, tasks and the
debug config come with the repo.

**The everyday loop:**

1. **Preview it.** Right-click `index.html` → *Open with Live Server* (or
   `Alt+L` `Alt+O`). It opens http://127.0.0.1:5500 and reloads on every save,
   so you see changes instantly.
2. **Edit.** `index.html` for copy, `styles.css` for looks, `app.js` for behaviour.
3. **If you touched `styles.css` or `app.js`**, run the bump task:
   `Ctrl+Shift+P` → *Tasks: Run Task* → **Bump asset cache version**. See below
   for why this matters.
4. **Commit and push** from the Source Control panel in the sidebar (`Ctrl+Shift+G`):
   type a message, click ✓ **Commit**, then **Sync Changes**.
5. GitHub Pages redeploys in under a minute. To confirm, run the
   **Check what's deployed** task — it compares your local version against the
   live site and tells you whether a push is still pending or your browser is
   just showing a cached copy.

### Why the version bump matters

GitHub Pages serves `styles.css` and `app.js` with a 10-minute `max-age`. Without
a version change, a returning visitor can load your freshly deployed HTML while
still running the *old* cached script — which silently breaks things. The
`?v=N` on both tags in `index.html` forces a fresh download. The
`Bump asset cache version` task increments it for you; `tools/bump_assets.py`
does the same thing from a terminal.

You don't need this while developing locally — Live Server disables caching.

### Tasks available

| Task | What it does |
| --- | --- |
| **Bump asset cache version** | Increments `?v=` on both asset tags in `index.html` |
| **Check what's deployed** | Compares your local version against the live site |
| **Serve site (Python)** | Plain HTTP server on port 4321, if you'd rather not use Live Server |

### Debugging

Start Live Server, then press `F5` to attach Chrome's debugger — you can set
breakpoints directly in `app.js`.

## Running it without VS Code

```bash
python -m http.server 4321
```

Then open http://localhost:4321. (Opening `index.html` directly as a `file://`
URL also mostly works, but serving over HTTP matches production.)

## Features

- Live GitHub project grid with search, language filters and sorting
- Dark / light theme, remembered between visits, defaults to your OS setting
- Responsive down to mobile; keyboard accessible (`/` focuses search, `Esc` clears)
- Respects `prefers-reduced-motion`
