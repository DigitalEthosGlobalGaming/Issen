# Special weapon props

Built-in ImageGen original, unchanged projectcopy,1774×887 RGBA. Created2026-10-01. Style reference player-ronin-simple.png.

| Part | Frame x,y,w,h | Atlas-global anchors |
|---|---|---|
| Koken emitter handle |329,96,1102,195|muzzle(1400,194), grip(1000,194), pommel(331,194)|
| Complete fryingpan |95,336,1589,498|handgrip(500,584), bowlcenter(1340,584), far right rim(1681,584), pommel(97,584)|

Emitter axis points right. Scale its muzzle to runtime x.02, handle leftwards to-.16; keep beam as existing procedural animation/glow (not baked). Its claw opening retains space for beam origin. Pan visiblebounds97,338..1681,831; long handle left, bowl right. Fit handle grip to runtime origin and bowlcenter to approximately(.33,0); outer right reaches .47. Native aspect and existing gameplay reach may differ slightly; keep gameplay measurements unchanged and fit artwork, not inputs. Pan gold awakening is a cached recolor overlay on this same body, not a newpiece.

65.763% exactlytransparent pixels. Packed rectangles avoid emitter/pan overlap (not equaltwo-row crops; pan starts y338 above nominalmidpoint443). Truealpha verified, shapes complete. Full prompt:

> Create a transparent game prop atlas with TWO separate complete items in TWO HORIZONTAL ROWS, ONE COLUMN on wide landscapecanvas. Top row a compact horizontal fantasy light-sword EMITTER HANDLE ONLY, pommel LEFT, emitter RIGHT, dark charcoal faceted metal with two broad pale steel collar bands and a tiny muted cyan accent; NO beam or blade attached. Bottom row a complete cast-iron FRYING PAN weapon lying horizontal, long dark handle extending LEFT and large circular shallow pan bowl at RIGHT, shown face-on slightly oblique so bowl circle clearly readable. Pan bowl dark three-tone charcoal, one broad gray rim facet, no food, no texture, no logo. Both components clean opaque silhouettes, generous transparent space all sides, no overlap. Match attached player art: extremely simple broad polygon facets, matte muted charcoal and gray, not detailed not realistic. TRUE transparent background, no glow, no particles, no ground, no shadow, no labels. Top emitter axis and bottom handle axis exactly horizontal. Intended spriteassembly: emitter muzzle is right-end attachment for runtime lightbeam; pan handgrip on left handle. Fullpancomplete and uncut.
