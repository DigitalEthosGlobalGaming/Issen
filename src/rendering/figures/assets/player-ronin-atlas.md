# Player ronin puppet atlas

Original AI-generated RGBA atlas, 1254 × 1254. Created with built-in ImageGen on 2026-10-01, using environment pine-atlas.png as style-only reference. Source retained unchanged at C:/Users/Trent/.codex/generated_images/01a0f69e-a725-7471-b799-ac4b88bc570f/exec-22b0762c-de92-44f5-81b0-27d45aeb2a88.png. No downloaded artwork. Prompt requested nine separate rear-view charcoal/ivory ink-faceted puppet pieces with transparent gutters, no sword, no scenery.

Source frames are [x,y,width,height] pixels; renderer uses measured tight frames rather than nominal 418² cells. Upper-right skirt extends a few pixels beneath nominal row boundary; right sleeve begins at y459 to exclude that skirt.

| Piece | Frame | Pivot / attachment |
|---|---|---|
| Back torso |49,54,367,356|top center neck; target y-.835 to-.48|
| Head/topknot/neck |523,110,227,281|bottom-center neck; target y-.973 to-.802|
| Left lower panel |866,44,356,382|top right waist overlap|
| Right lower panel |38,449,376,373|top left waist overlap|
| Left upper sleeve |500,459,226,371|top center shoulder, bottom center elbow|
| Right upper sleeve |920,459,252,373|top center shoulder, bottom center elbow|
| Left forearm |135,857,151,351|top center elbow, bottom center wrist|
| Right forearm |551,858,148,355|top center elbow, bottom center wrist|
| Closed hand |960,921,161,234|center grip; wrist top|

Joint pivots are normalized .5,0 and .5,1 within the tight frame. Renderer overlaps joints by .018 figure units. It stretches limb length to the existing exact pose targets, with fixed sleeve/forearm width, rather than introducing a gameplay skeleton or changing sword grip. Left h1/right h2 identities remain stable throughout crossing swings. One closed hand is reused for both grips; fine finger articulation is outside this initial rig.

Body/arms support rear-view default sumi robe; head supports rear-view default uncovered variant. Other cosmetics retain their procedural rendering. Canvas transforms/alpha are inherited, each renderer owns loading/disposal, no gameplay RNG or shared preview state is used. Reduced motion/flashes freeze panel sway.

Final fitting: panels attach at x=-.26 and -.065 with width .325 and height .52, y=-.51. Their horizontal shear is -.065 and +.065 respectively. An opaque dark under-robe spans the .24-wide waist and tapers beneath the panels, joining the center without widening the hem. The top-right/top-left attachment labels above describe overlapping sides, not exact corner pivots; the current render uses these explicit placements. Upper/lower pieces overlap behind the retained procedural obi.

Alpha inspection: browser Canvas decoded RGBA successfully. Transparent exterior and gutters inspected visually; alpha>16 content bounds were measured per nominal cell to derive tight source frames. No percentage-of-transparent-pixels metric was recorded. The skirt crossing the first nominal row was accounted for with explicit frames.

Full generation prompt:

> Create a production-ready modular rear-view ronin paper puppet sprite atlas on TRUE TRANSPARENT background. Reference image is STYLE ONLY: charcoal Japanese ink, rough dry brush angular low-poly facets, subtle warm ivory edge light from upper left. NO TREES. Square canvas, exact 3 by 3 equal cells with wide empty gutters. Each cell contains exactly ONE separate disassembled body component, fully within its cell, centered with 15 percent clear margins. No labels or grid. Row1 left: rear torso from neck to waist, charcoal kimono, no head, no arms, no skirt, simple ivory back seam. Row1 middle: back of human head with black topknot and short neck, no face, no hat. Row1 right: left flared lower hakama robe panel, waist at top and uneven hem at bottom. Row2 left: matching right flared lower hakama panel. Row2 middle: left upper sleeve segment shoulder to elbow, vertically downward neutral orientation, broad kimono fabric, rounded overlap at both joints. Row2 right: matching right upper sleeve segment vertically down. Row3 left: left wrapped forearm segment elbow at top wrist bottom, vertically down, no hand. Row3 middle: matching right wrapped forearm segment vertically down, no hand. Row3 right: one small closed gripping fist rear view, wrist top, fingers bottom, neutral warm ivory skin, no weapon. All nine components belong to same rear-view adult ronin with dark charcoal robe and muted ivory highlights. Disassembled animation parts, NOT assembled characters. No swords, accessories, scenery, ground shadows, backgrounds, detached speckles or additional objects. Strong readable angular silhouette, opaque ink bodies, genuinely transparent outside.
