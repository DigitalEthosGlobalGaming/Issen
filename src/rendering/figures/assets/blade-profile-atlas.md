# Modular blade profiles

Original built-in ImageGen output, copied unchanged. Actual1254×1254 RGBA. Source: C:/Users/Trent/.codex/generated_images/01a0f69e-a725-7471-b799-ac4b88bc570f/exec-b53ae1a0-fa9d-4339-a0ba-b8ef28cc84a8.png. Style reference player-ronin-simple.png. Created2026-10-01. Earlier2172×724 trials remain preserved in generated_images (exec-4faa69b2-3011-4966-ba37-1ed695ec6f07.png and exec-3fdce3f5-e514-4b5e-8ecc-7e232bb0a022.png), not used by final asset.

Frames x,y,width,height pixels. Root/tip atlas-global coordinates, visually estimated on measured alpha>16 silhouettes; validate final assembled sword against tipOf. Blade root is separate from runtime hand grip.

| Profile | Frame | Root | Tip | Suggested equipment |
|---|---|---|---|---|
| standard |152,111,955,92|154,154|1104,113|steel,kuro,beni,oboro,mura,raijin,sakura,kage,kiku,yuki,masamune|
| long |50,300,1179,88|52,352|1226,302|tsuki|
| short |159,486,947,116|161,537|1103,488|kodachi|
| serpent |110,696,1045,95|112,733|1152,698|orochi|
| heavy |94,892,1091,89|96,937|1182,894|doji,onikiri|
| wood |107,1080,1043,78|109,1113|1147,1098|bokken|

Tsubame can use long/slender profile at its own .50 length; physical scale follows item style rather than atlas pixel length. Standard profiles share neutral gray facets for cached item tint. All6 have a flat left root, no handle/guard. Align root to local(.016,0); scale/rotate root→tip to match runtime(L,-.05L), L from current blade style. Preserve handle size separately so long blades do not enlarge hands.

Alpha:65.397% exactlytransparent pixels. Visible(alpha>16) content occupies isolated rows. Generated nearlytransparent white/red/yellow fringe remains outside silhouettes; most excluded by tight frames. If needed discard alpha≤16 once when caching each cropped component; do not grow opacity of those pixels during tinting. Native preview over transparency can exaggerate this faint residue. No silhouette crosses assigned frame. Integration should inspect over film background.

Full final prompt:

> Create clean flat vector-like low-poly sword BLADE sprites, TRUE transparent background. Square canvas with SIX EQUAL HORIZONTAL ROWS one column. Exactly one fully isolated horizontal blade in the CENTER of each row. Each blade occupies at most ONE THIRD of its row height, leaving huge clear transparent gutters above and below. Every blade root LEFT and tip RIGHT. Six blades same length filling80percentcanvaswidth, but distinct silhouettes: row1 standard narrow curved katana; row2 very slender long nodachi; row3 broader stout kodachi; row4 gently wavy serpent spine just two shallow curves; row5 heavy straight demon-slayer with angular clipped point; row6 brown wooden bokken blunt rounded tip. ONLY blade, NO HANDLE, NO GUARD, NO MOUNTINGTANG, flat mounting root atleft. Use three broad flat steelgray facets and a THIN clean ivory edge, brown tones for wood. NO photorealism NO texture NO grain NO brushwork NO speckles NO whitehalo NO coloredfringe NO shadow NO glow. Clean anti-aliased opaque polygon boundaries with transparent exterior. Simple broad planar style of attached player ONLY. Blade curvature very slight so eachfits its narrow rowcenter. No labels or diagrams. Do not assemble swords.

