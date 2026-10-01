# Bamboo landmarks

Original generated **1254 × 1254 RGBA** sheet. Four independent complete cutouts, intended as distinctive large midground landmarks, approximately 180–320 px visible width. Native aspect ratios must be preserved. The angular charcoal/warm-gray/ivory planes and interior dry ink texture match the inspected `bamboo-atlas.png` reference. No figures, text, sky, scenery plate or ground rectangle.

## Measured frame contract

This is **packed artwork, not a uniform 2×2 grid**. Use explicit source rectangles below. All coordinates are pixels with a top-left origin. Ground anchors are **frame-local**, chosen visually at the principal supporting feet/root line; they are placement conventions, not universal anchors. Visible bounds are frame-local `left,top,right,bottom`, with right/bottom exclusive and alpha threshold >16.

| Variant | Source x,y,width,height | Local ground anchor x,y | Visible bounds |
|---|---|---|---|
| Crossed leaning stalks | 0,0,627,760 | 335,695 | 87,75,568,707 |
| Sparse snapped thicket | 627,0,627,760 | 323,700 | 132,126,510,717 |
| Low foliage fan | 0,760,627,494 | 320,380 | 47,49,600,398 |
| Fallen arched canes | 627,760,627,494 | 347,392 | 92,102,604,408 |

Measured 1,144,486 fully transparent pixels. Every listed rectangle's perimeter has maximum alpha 1, so no meaningful neighboring silhouette crosses the crop; negligible generated specks remain unchanged. Transparency includes the open gaps inside the forms. The original source PNG has not been manually repainted or resampled.

Use each cutout as an independent landmark, not a seamless tile or an animation frame. Keep a clear area around its silhouette and place the base into the chosen terrain line. A small runtime ground fade or fog overlay can hide joins; no scene-wide fog is baked in. At widths below 180 px the fine dry ink detail recedes, but the major silhouettes remain distinct. Optional horizontal mirroring changes light direction, so use it only when that lighting tradeoff is acceptable. Avoid strong rotation or aspect stretching. Integration preview remains the caller's responsibility.

## Provenance

Created 2026-10-02 with built-in imagegen; reference `src/rendering/environment/assets/bamboo-atlas.png` was visually inspected and supplied. Final source: `exec-50827a96-cd0d-470d-a41d-d683154affcd.png`. Project PNG preserves the entire final generated sheet.

## Initial generation prompt

Initial source `exec-bf654a4f-170d-42fd-a932-4aad2616484d.png` was rejected because bottom clusters touched at a proposed crop boundary. A built-in layout edit separated them. The final layout still has unequal row heights; the measured contract above takes precedence over the requested grid.

Layout correction prompt: Edit this bamboo atlas ONLY LAYOUT. Preserve all four exact bamboo cluster designs/art style. Repack to a STRICT UNIFORM 2x2 square grid with each entire cluster centered wholly inside its quadrant. SHRINK each cluster enough to leave at least 12% of its cell width and height transparent margin on ALL FOUR sides. In particular bottom-left fan and bottom-right arch currently nearly touch: separate them with a very wide clear central vertical gutter. Tall top clusters must end above the horizontal middle line. No artwork may cross either center line. Keep native proportions of each cluster, no stretching. Whole complete objects including all roots and leaf tips. True alpha background, no visible grid, no labels or extra objects.

Production game environment atlas FOUR DISTINCTIVE BAMBOO LANDMARK THICKETS, 2x2 on true transparent square canvas. Reference is art style only. Charcoal near-black warmgray mutedivory ink and broad low-poly angular leaf shapes, restrained drybrush inside forms, commonupperleft lighting. All4 silhouettes distinctly different to read at180–320px wide in midground. TOPLEFT: two or three tall leaning crossed bamboo stalks making a clear asymmetrical X with sparse high leaves. TOPRIGHT: sparse broken cluster of snapped bamboo trunks, varied heights, jagged ends, almost no foliage. BOTTOMLEFT: low wide FAN-SHAPED foliage cluster from several radiating short bamboo canes, a broad windswept fan not a vertical forest. BOTTOMRIGHT: fallen bowed/arched bamboo canes making a low WIDE arch like bent stems, a few attached angular leaves, both tips touching baseline, no upright tree silhouette. Complete entire clusters including tips and stems, separated by huge clear gutters; keep all shapes at least10% inside their own quadrant. Narrow point roots no earth plate. NO extra rocks, groundplate, horizon, sky, mist, person, animals, scenery, backdrop, paper, text, labels or grid. Four independently movable transparent cutouts. Keep true alpha in all gaps between leaves/stalks.

