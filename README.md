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

## Running it locally

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
