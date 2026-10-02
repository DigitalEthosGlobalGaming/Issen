# Startup artwork loading (1.26.0)

As of 1.35.0 the loading screen displays the actual Issen logo. The preloader
loads and decodes this priority asset before requesting ordinary artwork. Retry
still retries only missing images, and disposal during the priority stage stops
the remaining requests. The logo remains visible while the rest loads.

`src/main.ts` discovers image files through Vite globs covering all of `src/`
and `public/` (PNG, JPEG, WebP, AVIF, GIF and SVG, including uppercase extensions).
New modular atlases enter this manifest automatically. Source images use Vite's
resolved asset URLs; public images use the configured base path. The same paths
work with deployed web assets and Capacitor's locally packaged Android files.
There is no remote image service or special Android download path.

Before mounting the game, `src/platform/artwork-preload.ts` loads each unique URL
and awaits its `HTMLImageElement.decode()`. Decoded images remain retained until
application disposal. Existing renderers can create their own images and benefit
from the browser cache; this does not guarantee a browser never decodes again.

`src/ui/startup-loading.ts` shows an accessible progress indicator. Loading or
decode failure (including a 45-second per-image timeout) blocks startup and offers
Retry loading. Retry preserves successful images and retries only missing ones.
There is deliberately no continue-with-missing-art path. HMR disposal cancels
pending images and prevents an obsolete async startup from mounting the game.
No settings or saves are changed.

Focused checks: `node --test tests/unit/artwork-preload.test.mjs` and
`npx playwright test tests/browser/artwork-loading.spec.ts`. These check delayed
decode, load/decode failures, retries, deduplication, disposal, and browser startup
gating. Android packaging and release builds need their normal release validation;
the focused development checks do not replace that.

Verified in this art pass: all 41 image files in the current src/public inventory
appear in the manifest. Strict TypeScript, three preloader unit checks and three
focused browser checks passed. Desktop/tablet loading and post-load title screens
were inspected. No production build or full Android test was run.
