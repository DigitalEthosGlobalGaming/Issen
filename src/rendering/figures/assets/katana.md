# Ink katana

Generated 2026-10-01 with the built-in image tool. Final project copy: `katana.png`.
The project PNG preserves the generated source unchanged.

Actual image: **2172 × 724 RGBA**. One complete side-view weapon, hilt left, tip right (+X). Charcoal wrapped hilt, warm gray guard and silver/ivory blade. No hand, scabbard, ground or effects. Physical sprite remains independent of aura, trails and glints.

## Attachment geometry

Coordinates are source-image pixels from top-left, without trimming:

- Grip/hand origin immediately behind the guard: **(535, 355)**.
- Visible blade tip: **(2064, 306)**.
- Visible body bounds at alpha >32: **(106, 265, 1959, 178)** as `(x,y,width,height)`.
- Standard figure-space blade endpoint: **(0.52, -0.026)** relative to grip.

`ink-sword.ts` applies a uniform scale and a small angular correction so the selected source tip lands exactly on the existing `tipOf()` endpoint `(length,-length*0.05)`. Native proportions remain unchanged. The pommel lies roughly0.146 figure units behind grip at standard length0.52, close to the original0.15 hilt. The source's gentle curve is retained. A supporting hand can overlap the handle behind the pivot; do not move the grip to the image center.

Caller must gate rear-view player + item ID `steel`. Renderer returns false while loading, after disposal, for special physical `kind` forms, or nonstandard length. Same-length steel awakening aura/glow is supported as **external overlays**. The module draws no aura/trail/edge/glint itself. All other equipment remains on classic geometry. Downstream film grading applies normally. Source palette is neutral; `_C` is accepted for the shared draw contract but does not recolor this standard physical sprite.

Rotate around grip for poses; do not mirror independently of the parent figure because curvature, light direction and blade edge are asymmetric. Preserve draw context opacity/transform. One image load per renderer instance; dispose settles any pending preparation and clears source references.

## Inspection

Alpha extrema0–255; **92.15%** exactly transparent. Entire visible body stays within image, with more than100px horizontal clearance and265px top padding. Fine semi-transparent dry-brush specks remain around blade edge. Visually inspected complete silhouette, slender blade, hilt wrap, tip and palette. No cropped endpoints or incidental objects. Source kept unmodified.

Style references inspected: existing `field-rocks-atlas.png`, ink-game-assets art direction and weapon contracts. The sword uses the same charcoal/ivory faceted vocabulary without copying terrain fog.

## Generation prompt

ONE standalone Japanese katana weapon sprite for a 2D ink-faceted game, complete sword in strict flat side elevation, lying horizontal pointing to the RIGHT (+X). Hilt on LEFT, sharp tip on RIGHT. Long slender gently upward-curved silver/ivory steel blade with a clean bright cutting edge; charcoal wrapped handle with subtle warm-gray diamond wrap, a modest dark oval tsuba guard seen side-on. Blade about78% of total sword length, handle22%; extremely slender blade about2.5% of blade length thick, gentle curve rising only about5% of blade length from guard to tip. Japanese dry-brush ink and angular low-poly-like value facets, dark charcoal/gray hilt, muted ivory steel highlights, economical texture inside forms, no glossy photoreal3D shading and no cartoon outlines. Upper-left light. Entire sword including pommel and tip fully contained with at least12% transparent padding on each side; center weapon in wide landscape canvas. TRUE transparent alpha background. No hand, no arm, no person, no sheath, no stand, no ground, no shadow, no fog, no slash trail, no aura, no sparks, no text/logo/border. Single clean isolated physical sword only. Keep horizontal handle axis exact, no diagonal overall pose.
