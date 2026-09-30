# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

A pixel-clone of a Figma design (source export at `../1.pdf`, one level above
this folder) for "Museum of Minimalism": the homepage is a verbatim clone of
the reference site [milamiss/Online-museum](https://milamiss.github.io/Online-museum/),
and on top of it sits a multi-step ticket-booking flow (exhibition page ->
plan visit -> reservation -> checkout -> done) built from the Figma mockup.
See `README.md` for the full stack write-up (in Russian) and user journey.

## Run locally

```bash
cd museum-of-minimalism
pip install -r requirements.txt
python app.py
```

Serves on **http://localhost:5000**. A `.claude/launch.json` config
(`museum-flask`) is already set up for the `preview_start` tool. Always use
the `preview_*` tools (not raw `Bash`) to run/inspect the dev server and
verify UI changes in-browser.

The newsletter subscribe form (`/api/subscribe`) validates and appends to
`subscribers.csv` (project root, gitignored) directly in `app.py` — no
external interpreter or subprocess involved, so it works unmodified on
Render. File access is guarded by an OS-level lock (`msvcrt` on Windows,
`fcntl` on POSIX) to stay safe under concurrent requests.

## Architecture

- **`app.py`** — all routes/business logic. Booking state lives in the Flask
  `session` as two keys: `booking` (set by `POST /plan/<slug>`, cleared by
  `/done`) and `order` (set by `POST /reservation/confirm`, promoted to
  `last_completed_order` on payment). `/reservation`, `/checkout`, `/done`
  all redirect to `/` if the expected session key is missing — there is no
  way to land on them directly without going through the flow first.
- **`data.py`** — all content as plain dicts (`EXHIBITIONS`, `EVENTS`,
  `RECOMMENDATIONS`, `ARCHIVE`, `PODCAST`, `PROMO_CODES`,
  `FUTURE_EXHIBITIONS`). Events share the exact same field shape as
  exhibitions (`tickets`/`time_slots`/`interactions`/...) so `app.py` merges
  them into one `BOOKABLE_ITEMS` lookup and reuses the same templates/routes
  for both — check `data.py`'s shape before adding a new bookable item.
- **Templates** (`templates/`) — Jinja2, extend `base.html`. `index.html` is
  the cloned homepage; `exhibition.html` doubles as the event detail page;
  `reservation.html` / `checkout.html` / `done.html` are the booking flow.
- **CSS is intentionally split by origin, don't mix them**:
  - `static/site/css/style.css` — the reference site's CSS, copied close to
    verbatim (only a couple of originally-global selectors were scoped).
    Treat as read-mostly; it's the source of truth for anything on the
    cloned homepage.
  - `static/css/flow.css` — all styling for the booking-flow pages
    (`.flow-page`), hand-built to match the Figma mockup. This is where
    almost all page-specific work happens.
  - `static/css/interactive.css` — burger menu / search overlay, shared
    across all pages.
  - `static/css/mobile.css` + a `@media (max-width: 900px)` block at the
    bottom of `flow.css` — responsive overrides. Bootstrap 4.5.2 is loaded
    from a CDN in `base.html` and used for column stacking on the homepage.

## Recurring gotchas (learned the hard way this project)

- **CSS specificity trap**: `.flow-page h1, h2, h3, h4 { margin: 0 0 0.4em }`
  and `.flow-page a { text-decoration: none }` are both two-selector rules
  that silently beat single-class overrides (`.some-title { margin: ... }`,
  `.some-link { text-decoration: underline }`). This has bitten several
  features already — reach for `!important` on the override rather than
  spending time on it, and say why in a one-line comment.
- **Bootstrap class-name collisions**: this project's own class names
  occasionally collide with Bootstrap 4 utility/grid classes loaded
  globally (e.g. a hand-rolled `.row` inside `.session-card` inherited
  Bootstrap's `.row { margin: 0 -15px }` and bled outside its card). If a
  custom class is a common word (`row`, `card`, `container`...), check it
  isn't already a Bootstrap class, or defensively reset the properties
  Bootstrap sets (`margin`, `display`).
- **Negative z-index needs a local stacking context**: `z-index: -1` on a
  pseudo-element with no ancestor that has both `position` and an explicit
  `z-index` escapes to the document root and paints *behind* `<body>`'s own
  background — i.e. it becomes fully invisible, not just "behind its
  parent". Fix by adding `z-index: 0` (any integer) to the nearest
  `position: relative` ancestor.
- **Matching the Figma export precisely**: `1.pdf` (one directory above this
  project) is the pixel source of truth. Use PyMuPDF (`fitz`) to read exact
  coordinates/font sizes rather than eyeballing — `page.get_text('dict')`
  for span-level bbox/font-size, `page.get_drawings()` for lines/borders/
  fills, `page.get_pixmap(matrix=..., clip=...)` to render a crop for visual
  sanity-checks. The mockup canvas is 1440pt wide; a `pt * 0.8` conversion
  matches this project's ~1152px container reasonably well for isolated,
  fixed-size elements — but the **live viewport is often wider than that**,
  so two flex/grid siblings that both used fixed-px conversions can end up
  competing for space in a way the mockup never had to. Prefer percentages
  or `flex-basis`/`aspect-ratio` over fixed px wherever an element sits
  next to a flexible sibling, and say so in a comment when you deliberately
  accept a small deviation (e.g. text wrapping to one more line than the
  mockup) rather than over-engineering a fix.
- On Windows, PyMuPDF's `pix.save(...)` needs a real filesystem path — write
  crops to the scratchpad dir, not `/tmp`.
- **Two-tone hero titles must split on word boundaries, not pixels or lines**:
  `exhibition.html`'s hero title (`.ex-hero-title-wrap`) normally renders two
  stacked `<h1>`s (`is-light`/`is-dark`) clipped at a fixed pixel offset from
  the container's right edge, so part of the title reads white-on-photo and
  part reads dark-on-cream-panel — tuned per exhibition via a `padding-right`
  override (`ex-hero-title-wrap--nominal`/`--perfection`/`--conciseness`).
  That pixel-boundary approach only works for a single-line, single-word
  split. For multi-word titles where whole words must stay one color
  regardless of viewport (e.g. "DESIGN" always dark, "OUR LIVES" always
  dark), use the `ex-hero-title-wrap--split-dark-tail` variant instead: it
  disables the `is-dark` layer entirely and wraps the trailing N words in
  their own `<span class="ex-hero-title-dark-word">` (see the
  `dark_tail_words` dict in `exhibition.html`), colored explicitly. A
  `::first-line`-only approach was tried first and is wrong: it colors
  whatever happens to be on line 1, which changes with viewport width (a
  title that fits on one line at a wide viewport would make the trailing
  word white too).
- **`preview_start` can fail with "port in use" by a PID that doesn't
  actually exist** (`Get-Process`/`taskkill` find nothing, but
  `Get-NetTCPConnection` still shows it `Listen`ing) — seen as a recurring
  WSL-adjacent artifact on this Windows box. Don't fight it: add
  `"autoPort": true` to `.claude/launch.json` (app.py already reads the
  `PORT` env var), and if a real browser (opened earlier via
  `claude-in-chrome`) is already pointed at `localhost:5000` and serving
  pages fine, that dev server is alive and well — Flask's reloader picks up
  template/CSS edits with no restart needed, so you can just reuse that tab
  (`tabs_context_mcp` / `navigate` / `javascript_exec`) instead of chasing
  the port.
- **`claude-in-chrome`'s `resize_window` did not reliably change
  `window.innerWidth`** in this environment (window stayed at its original
  size despite a "success" response). When you need to sanity-check a
  `@media` block's rules but can't get a real narrow viewport, inject a
  `<style>` tag that force-applies the same declarations unconditionally,
  read the computed styles, then remove the tag — proves the selectors and
  values are correct even though it doesn't prove the breakpoint itself
  fires. Prefer `mcp__Claude_Preview__preview_resize` (`mobile` preset,
  375px) when that server is reachable; it has reliably reflected real
  viewport width changes this project.
- **Reusable non-stretching section heading**: `.section-header-row` >
  `.section-divider-heading` (bleeding 160px line + heading, from
  `site/css/style.css`) + `.section-header-line` (fixed 160px, pushed to
  the right edge via `margin-left: auto`) is the "Exhibition/Listen/In
  Future" pattern — short lines, heading NOT centered. This is distinct
  from `.section-title-row` (flow.css), which STRETCHES full-width lines
  around a centered heading (`checkout.html`'s "Your Order",
  `done.html`'s "Recommendations") — the two are not interchangeable, ask
  before assuming which one a new heading should use. A third variant,
  `.section-title-row--edge-lines`, uses short 160px lines but keeps the
  stretching row's centering behavior — used on `done.html`. Both
  `reservation.html`'s "Confirmation" and `exhibition.html`'s "Plan your
  visit" were migrated from the stretching pattern to
  `.section-header-row` on request; the heading tag is often `h2` there,
  which needs its own `font-size`/`margin: 0 !important` rule since
  `.section-divider-heading h3` only targets `h3`.
- **Floating info card instead of a grid column**: `reservation.html`'s
  interaction card (`.session-card-wrap`) is `position: absolute; top: 0;
  right: 0` inside a `position: relative` `.ticket-summary`, not a second
  grid/flex column — this lets the photo+text column use the *full* row
  width instead of sharing it 50/50, while the card floats over otherwise-
  empty space near the top. On mobile it's reset to `position: static;
  width: auto` so it falls back into normal document flow above the title.
  Reach for this pattern whenever a small card should overlay free space
  in a tall element rather than compete for width with it.

## Verifying changes

Always launch the dev server via the `preview_*` tools and check both a
desktop width and the `mobile` preset (375px) — the booking flow has a
`@media (max-width: 900px)` stacking breakpoint that's easy to break with a
new absolutely-positioned or fixed-width element. To reach `/reservation`
without a real click-through, POST to `/plan/<slug>` first via
`preview_eval`, e.g.:

```js
fetch('/plan/sequence', {
  method: 'POST',
  headers: {'Content-Type': 'application/x-www-form-urlencoded'},
  body: 'interaction=xr&time_slot=1:30 pm&date_label=' + encodeURIComponent('saturday • May 16, 2026')
}).then(() => location.href = '/reservation')
```

`preview_screenshot` has occasionally rendered at a squashed/low-res canvas
regardless of the configured viewport (a tool quirk, not a CSS bug) — when
that happens, verify with `getBoundingClientRect()`/`getComputedStyle()`
via `preview_eval` instead of trusting the screenshot.
