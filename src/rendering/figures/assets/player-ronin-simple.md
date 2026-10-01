# Simplified rear-view ronin

Built-in ImageGen edit, 2026-10-01. Input: player-ronin-atlas.png. Repository PNG is an unchanged copy. RGBA 1254×1254; Canvas alpha measurement found 67.095% fully transparent pixels. Broad matte charcoal facets replace fabric grain and tiny detail.

Frames [x,y,width,height] in source pixels:

| Part | Frame | Pivot |
|---|---|---|
| Torso |45,54,382,358|neck top center|
| Head |523,110,229,282|neck bottom center|
| Left panel |864,45,366,392|upper waist overlap|
| Right panel |37,452,380,369|upper waist overlap|
| Left sleeve |503,464,233,368|top shoulder/bottom elbow|
| Right sleeve |924,465,257,368|top shoulder/bottom elbow|
| Left forearm |134,861,165,344|top elbow/bottom wrist|
| Right forearm |554,861,155,344|top elbow/bottom wrist|
| Hand |959,926,165,236|center grip|

Frames measured from alpha>16 bounds then padded; explicit rectangles exclude skirt spill beneath nominal row1 and torso spill across nominal first-column boundary. Limb pivots use normalized (.5,0)/(.5,1), .018 figure-unit joint overlap. Pose stretches limb length to exact existing hand targets. All sleeves, forearms and hands render before torso/head for rear-view occlusion; identities remain stable across crossing poses.

Panels x=-.26/-.065, width .325, height .52, attachment y=-.51; shear -.065/+.065. A dark opaque under-robe bridges the .24-wide waist and center beneath the panels. The generated torso provides the fabric waist join. The parent suppresses the classic flat obi for this supported Ink body only. Existing cosmetic hooks remain independent.

Full edit prompt:

> Edit this modular ronin atlas keeping exactly the same nine separated components in the same 3x3 positions, rear view and silhouette proportions, TRUE transparent background. RADICALLY SIMPLIFY EVERY PIECE into minimalist flat shaded low-poly game art: ONLY THREE broad matte tones (near-black charcoal, dark gray, muted middle gray), each component has just two or three LARGE angular facets. Remove ALL fabric texture, weave, brush grain, hair strands, tiny folds, wrappings, linework, bright highlights. Nearly solid dark silhouettes with minimal flat gray facets, no ivory fabric edges. Torso simple broad rear kimono trapezoid with a subtle plain fabric waist join; head one solid topknot silhouette with one gray plane, no strands. Two broad simple hakama panels with only two long planar folds each. Upper sleeves and forearms plain chunky charcoal angular shapes with absolutely NO wrapping stripes. Hand a small simplified mitten silhouette in muted warm gray, no detailed fingers. Preserve disconnected parts and generous transparent space; no assembled character, no sword, no labels, no background. Strong understated indie low-poly readability at tiny scale. Keep full pieces inside original cells.
