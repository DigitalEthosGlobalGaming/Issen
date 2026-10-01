# Stone landmarks

Original generated **1254 × 1254 RGBA** sheet. Four independent complete cutouts, intended as distinctive large midground landmarks, approximately 180–320 px visible width. Native aspect ratios must be preserved. The angular charcoal/warm-gray/ivory planes and interior dry ink texture match the inspected `field-rocks-atlas.png` reference. No figures, text, sky, scenery plate or ground rectangle.

## Measured frame contract

This is **packed artwork, not a uniform 2×2 grid**. Use explicit source rectangles below. All coordinates are pixels with a top-left origin. Ground anchors are **frame-local**, chosen visually at the principal supporting feet/root line; they are placement conventions, not universal anchors. Visible bounds are frame-local `left,top,right,bottom`, with right/bottom exclusive and alpha threshold >16.

| Variant | Source x,y,width,height | Local ground anchor x,y | Visible bounds |
|---|---|---|---|
| Split spires | 0,0,606,630 | 315,578 | 28,48,595,590 |
| Low eroded arch | 606,0,648,630 | 329,575 | 13,285,625,585 |
| Balanced angular stack | 0,630,678,624 | 373,570 | 111,28,636,585 |
| Leaning broken marker | 678,630,576,624 | 237,568 | 42,35,425,581 |

Measured 979,280 fully transparent pixels. Every listed rectangle's perimeter has maximum alpha 1, so no meaningful neighboring silhouette crosses the crop; negligible generated specks remain unchanged. Transparency includes the open gaps inside the forms. The original source PNG has not been manually repainted or resampled.

Use each cutout as an independent landmark, not a seamless tile or an animation frame. Keep a clear area around its silhouette and place the base into the chosen terrain line. A small runtime ground fade or fog overlay can hide joins; no scene-wide fog is baked in. At widths below 180 px the fine dry ink detail recedes, but the major silhouettes remain distinct. Optional horizontal mirroring changes light direction, so use it only when that lighting tradeoff is acceptable. Avoid strong rotation or aspect stretching. Integration preview remains the caller's responsibility.

## Provenance

Created 2026-10-02 with built-in imagegen; reference `src/rendering/environment/assets/field-rocks-atlas.png` was visually inspected and supplied. Final source: `exec-a4ca9ac5-8429-4335-a221-e21863d5e016.png`. Project PNG preserves the entire final generated sheet.

## Initial generation prompt

Production game environment sprite atlas: FOUR DISTINCTIVE LARGE STONE LANDMARKS in a generous 2x2 transparent sheet. Reference is art style only, NOT copy its low rock clusters. Match charcoal/warm-gray/ivory low-poly ink, broad simple angular faceted planes with restrained dry-brush texture INSIDE forms, common upper-left light. Readable 180–320px-wide midground silhouettes. TOP LEFT two tall jagged uneven rock spires standing close together with a clear vertical gap, TOP RIGHT one LOW WIDE eroded natural stone arch with a large open hole underneath, BOTTOM LEFT a distinctive balanced stack of three angular stones large capstone on narrow middle stone, BOTTOM RIGHT a single broken leaning angular stone marker with fractured top, uncarved NO text. All complete full forms at shallow side/front three-quarter view, clear ground-contact bottoms, NO ground plate, grass, extra pebbles, sky, landscape, fog, people, paper background, labels or grid. Each entire object inside its own quadrant with at least 12% transparent margin from all cell borders, generous central gutters. All four DIFFERENT shapes instantly distinguishable, not four generic boulders. True alpha transparency. Square canvas.

