# Coco AI — Product Requirements & Progress

## Original problem statement
User cloned `https://github.com/alifnewone7-create/c-run.git` (Coco AI trading-signals app: Next.js 16 App Router frontend + FastAPI backend + Firebase auth) and requested a series of frontend UI refinements. Language of the user: **Bengali** (always reply in Bengali).

Design system: "cosmic purple" — background `#0b0618`, iris `#6d3bff` / `#8b5cff` / `#b48cff`, soft violet borders, glass-morphism, display font `--font-display`, mono `--font-tech`. No white borders / pure white blocks / generic AI-slop.

## Architecture
- `frontend/` Next.js 16 (production `next start` via supervisor → **must `yarn build` + `sudo supervisorctl restart frontend` after code changes**).
- `frontend/components/coco/` theme shell, navbar, bottom nav, loading.
- `frontend/components/signal-kit.tsx` shared signal-tool pieces (BrokerBar, SegTabs, SearchBox, **MarketSections**, results).
- `frontend/lib/markets.ts` pairs + `category` (major/minor/exotic), `groupMarkets()`, `flagUrl()` (EU flag self-hosted at `/public/flags/eu.svg`).
- CSS: `app/coco.css` (shell/nav/sheets), `app/injector.css` (inj-*), `app/signals.css` (sig-*, fs-*, mk-*), `app/admin.css`.
- Backend FastAPI `/api/signals/*`; Mongo via MONGO_URL.

## Implemented (chronological)
- 2026-09 (earlier sessions): localStorage base64 asset cache; flat `#0b0618` loader; candles only on `/` and `/dashboard`; borderless admin panel; desktop top-nav consolidation with single "Analyze" button; lucide icon refresh; OTC/Real analyzer removed from mobile More menu.
- 2026-09-16 (this session):
  - Mobile bottom-nav sheets (Analyzer + More) now blur the page (`.coco-sheet-backdrop`, blur 16px).
  - "More" sheet redesigned: profile card (avatar, name, email, plan pill), 3 quick tiles, structured Log out button.
  - Market pickers grouped into **Major / Minor / Exotic** sections with sticky section headers (`MarketSections`), three distinct card styles: Live = list rows with live pulse, Injector = pill chips with accent rail, Future = multi-select tickets with check.
  - Future Signals: new setup panel (Selected markets + How many signals) and an action dock holding Generate (fixed above bottom nav on mobile, inline bar on desktop) — fixes the mobile button issue.
  - Fixed production CSS bug: lightningcss drops unprefixed `backdrop-filter` when `-webkit-backdrop-filter` follows it → all CSS now lists the `-webkit-` prefix first. (Keep this order for any new backdrop-filter rules!)
  - Fixed flagcdn CORS console noise (eu.svg served without ACAO) by self-hosting `/flags/eu.svg`; `<img crossOrigin="anonymous">` on flags.
  - Tested: testing agent iteration_9 (frontend) ~95% → remaining blur issue fixed & self-verified.

- 2026-09-16 (later session, user redesign request):
  - `marketLabel()` in `lib/markets.ts` → OTC pairs display as `USD/CHF (OTC)`; Major/Minor/Exotic section headers removed from Live/Injector/Future pickers (flat grid, `MarketSections`).
  - Live list "1m" pill → rounded-rectangle (8px radius). Live result: projected-path chart card removed; Money Management icon → lucide `Scale`.
  - Injector market cards → premium glass "lux" cards (`mk-lux-*`, flags + OTC tag + spark bars + arrow). Future signal result cards → `fsx` cards (index, flags, pair, direction tag, entry/expiry/MTG cells, tone bar); pair text wraps instead of truncating on ≤419px.
  - Broker result card (`BrokerLine` → `sig-bcard`) redesigned with accent glow, logo, "Signal broker" label, "Linked" badge; responsive.
  - Self-verified via screenshots on 1920px + 390px for Live/Injector/Future (no horizontal scroll). Test user tier set to `premium` via admin API for result testing.
  - Follow-up (same day): Injector cards — "OTC" tag removed, spark bars → ECG pulse line SVG (`mk-lux-pulse`), arrow → `Syringe` icon. Live/Future result cards no longer show `BrokerLine`; `BrokerBar` stays visible in result phase. Future `fsx` cards: aura/mesh/heavy shadows removed for mobile performance.
  - Follow-up 2: Future ticket cards drop the "OTC/Real Market" sub-label; setup card (selected markets + count) only appears after a market is picked; count default 5, min 5, max 20, presets 5/10/15/20, tap-to-edit `CountField` (commits on blur/Enter with clamp). Generate icon → `Radar`. OTC/Real tab icons on all pages → `Orbit` / `Globe`.
  - News Signals & Money Management pages rebuilt on the home/inj design system (`app/tools.css`: `tl-*` shared, `nw-*` news, `mm-*` management). No page title header, no white borders. News: segmented tabs, sticky day/stat side column (desktop) + vertical timeline of events, fundamental cards with confidence bars, bottom-sheet/centered detail modal. Management: tone-coloured config fields with badges/hints, MTG switch, live preview tiles, sheet layout with sticky progress panel + trade rows (win/loss/MTG menu), celebration modal. Verified 390px + 1920px.
  - Bugfix: news timeline rows now a CSS grid `[time][node][card]` (time no longer overlaps dot); event/fundamental lists moved outside the heavy `inj-panel`, hover transitions gated by `@media (hover:hover)`, `content-visibility:auto` on rows for smoother mobile scroll. Testing agent iteration_10: 100% frontend pass.
  - OTC/Real segmented-tab icons on Live/Injector/Future now use the home-page custom glyphs `GlyphOtc` / `GlyphReal` (`components/coco/coco-glyphs.tsx`), class `inj-seg-glyph`, subtle animation when active (hover-capable devices only).

- 2026-09-18 (dashboard v3 redesign, user spec in Bengali):
  - `/dashboard` rebuilt (`components/dashboard-content.tsx`, `components/dashboard/dash-*.tsx`, `app/dashboard.css`, `dsh-*` classes). Old profile/tier/tools sections deleted.
  - Mobile: top-left avatar + name/email header; avatar tap → bottom-sheet profile card (banner, ring avatar, verified icon for non-free tiers, tier chip, email card with copy, tier card, log out). Mascot (AI-generated fox character with COCO AI branding, chroma-keyed, `/public/dash/mascot.webp`) + "Open tools" button → blurred overlay with 3D rotating ring of 6 tool cards (`/public/dash/card-*.webp`, generated) → tap navigates. Trading tools grid removed.
  - Desktop: collapsible left sidebar (icon-only toggle, persisted in localStorage `coco_sidebar_collapsed`), full-width hero banner with mascot + avatar strip/stats, same ring overlay. TopNav not used on the dashboard (other pages unchanged).
  - Daily quota → gauge cards (240° SVG arc, per-feature tone), 2-col mobile / 5-col desktop; free tier shows locked gauges + unlock CTA.
  - Testing agent iteration_11: 100% pass (mobile + desktop). Test user `dashtest.coco@example.com` (premium) — see test_credentials.md.
  - CSS gotcha: plain `.dsh-*` display rules override Tailwind `md:hidden`; mobile-only blocks are hidden via a media query at the END of dashboard.css.
  - Follow-up (same day): lower dashboard zone is again the white `coco-light coco-curve-top` block (mobile + desktop, below the dark hero/mascot zone); quota gauges restyled for light zone; glow `drop-shadow` filter removed (mobile lag); arc now FILLS with usage (used/limit, hidden at 0 to avoid round-cap dots), centre shows used count + "of N used", footer "N left today". testid `quota-used-*` replaces `quota-remaining-*`.
  - Follow-up 2: restored the previous section chrome in the white zone — "Access tier" eyebrow, "Your plan and daily engine quota." headline (description removed per user), dark `coco-shade` "Current plan" card (plan name, reset-note toggle, Upgrade licence CTA), then the Daily quota panel with gauges. Section testid `dashboard-tier`, plan card `tier-plan-card`.

- 2026-09-18 (desktop hero cleanup, Banglish request):
  - Desktop hero: copy text ("Operator console / Welcome back…"), mascot, orbit ring and "Upgrade licence" button removed. Banner (230px) now shows a custom candlestick chart (`components/dashboard/dash-candles.tsx`, deterministic seeded data, mint/rose candles + glowing iris price line + dashed grid) with only the "Open tools" button (right, vertically centred).
  - Trading-themed frame: `.dsh-hero-frame` gradient hairline (mint → iris → rose) with soft blurred glow, chart-axis corner ticks (`.dsh-hero-tick-*`).
  - Avatar/name spacing fixed (avatar `margin-top:-74px`, strip-coloured 5px ring, `gap:16px`); email now a 44px rounded-rectangle (10px radius) matching the button shape.
  - Mobile "Open tools" button: pill → 10px rounded rectangle (same as desktop). "Open tools" icon on both → lucide `PocketKnife`.
  - Reminder: production `next start` → run `yarn build` + `sudo supervisorctl restart frontend` after changes.
  - Follow-up: frame glow removed (only the thin gradient hairline remains). SVG candle component deleted; banner now uses an AI-generated (Gemini Nano Banana) cosmic-purple candlestick artwork `/public/dash/hero-banner.webp` (1856×576, `object-fit: cover`, position `center 62%`) with a bottom shade overlay; banner height 250px, "Open tools" button moved to the calm left side.
  - Mascot replaced: new AI-generated (Gemini 3 Pro image, refs: user's techwear character + coco-profile.png) robotic hooded COCO AI character holding a holographic "C", luxury purple techwear; chroma-key removed via numpy → `/public/dash/mascot.webp` (580×1100). Mobile mascot height 300→350px. Generation script + raw assets kept in `/app/memory/assets/`.
  - Mascot v2: regenerated with the user's luxury trench-coat reference (gold-trimmed coat, tie, chain, belt, watch, glossy sneakers), robotic hooded visor head, levitating "C". Saved as NEW filename `/public/dash/mascot-v2.webp` (671×1100) to bust browser/Next image cache (old `mascot.webp` deleted). Rule: whenever an image is replaced, change the filename.
  - Mascot v3: regenerated from the user's seated-on-glowing-crate reference (`/app/memory/assets/ref_char3.png`, script `gen_mascot3.py`) → `/public/dash/mascot-v3.webp` (726×1100); v2 deleted.
  - Profile sheet: tier chip next to the name removed (mobile + desktop); mobile sheet is drag-to-dismiss (pointer events on `.dsh-sheet`, `is-dragging`/`is-settled` classes, close when dy > 110px). Mobile perf: `.dsh-root::after` noise disabled, mascot drop-shadow/shadow-blur animation removed, backdrop blur 14→6px on <768px. Testing agent iteration_12: all pass.
  - PERF ROOT CAUSE (mobile scroll lag): `body { background-attachment: fixed }` with 5 gradients in `globals.css` repainted the viewport every scroll frame → 22 fps. Fixed via `@media (max-width:767px) body { background-attachment: scroll }` → 61 fps (60 at 4× CPU throttle). Also on mobile: bottom-nav backdrop blur removed (near-opaque bg), mascot float animation + halo off, gauge transitions off, `100dvh`→`100vh` on `.dsh-root/.dsh-main`. Testing agent iteration_13: 100%. Method: rAF+scrollTo FPS probe + hide-element bisection via screenshot_tool.
  - Desktop banner art → AI-generated bull (green, left) vs bear (red, right) with candlestick chart on cosmic-purple bg: `/public/dash/hero-bullbear.webp` (ref: user's green/red banner, script `gen_banner2.py`). Banner 270px, "Open tools" button top-centre. Old hero-banner.webp deleted.
  - Banner v2: candles removed from the centre, purple-graded bull (mint-violet) / bear (rose-magenta) → `/public/dash/hero-bullbear-v2.webp`; frame hairline changed from multi-colour to dark-purple gradient (`#8b5cff → #2a1660 → #7c45ff`), corner ticks lilac.
  - Sidebar collapse toggle moved from the header to the footer (above the profile card) as a full-width `dsh-side-link dsh-side-toggle` row ("Collapse sidebar"); header now brand-only.

## Backlog
- P1: none pending from user.
- P2: Consider self-hosting all flag SVGs to remove the external CDN dependency entirely.
- P2: Presets + stepper on desktop Future setup wrap vertically in the narrower column (acceptable, could be a single row).

## Test credentials
See `/app/memory/test_credentials.md`.
