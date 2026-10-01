# Enemy clothing variants

Generated with built-in imagegen on 2026-10-02 using `enemy-ronin-simple.png` reference. Original preserved at `C:/Users/Trent/.codex/generated_images/01a0f69e-ec38-7b32-ac7e-d8aba4341821/exec-a63eadd4-a0c5-4c86-a98f-256a526785f5.png`.

1536x1024 RGBA, 54.54% fully transparent pixels. Packed 3x2 layout divides at y440, not y512. Frames include four pixels around alpha >16. No background rectangles; broad charcoal/gray facets, upper-left light. Runtime supplies tint/fog/film.

| Piece | Frame x,y,w,h | Rig y / height / width |
|---|---|---|
| Armored vest | 85,34,367,378 | -.835 / .355 / .3447 |
| Traveling coat | 562,22,400,413 | -.835 / .355 / .3438 |
| Monk wrap | 1117,42,286,377 | -.835 / .355 / .2693 |
| Armored lower robe | 53,459,427,509 | -.51 / .52 / .4362 |
| Traveling lower robe | 538,460,481,532 | -.51 / .52 / .4702 |
| Monk lower robe | 1102,459,377,522 | -.51 / .52 / .3756 |

Native aspect: width = rig height * source width / source height. Pieces center on the waist; lower robe pivots at top center, torso follows lean*.8. Existing whole-body width variation remains. Slim monk overlaps sleeves anchored at shoulder x+/-.15. Complete lower robes replace the original panel pair. Matching column derives from the saved visual seed without gameplay RNG. Arms/weapons remain separate.

## Full prompt

Create a production transparent game sprite atlas, 1536x1024 landscape, exactly 3 columns by 2 rows with generous transparent gutters. Reference establishes extremely simple broad flat low-poly charcoal ink facets, minimal interior detail, matte charcoal warm gray muted ivory, light upper left. SIX SEPARATE CLOTHING PARTS for front slightly three-quarter Japanese warrior puppet: top row LEFT broad segmented armored vest neck-to-waist, CENTER angular traveling overcoat torso neck-to-waist, RIGHT rugged sleeveless monk wrap torso neck-to-waist. Bottom row matching three waist-to-feet LOWER ROBE silhouettes: armored split skirt with broad plate planes, traveling robe asymmetric sweeping hem, rugged monk wrap long simple angular hem. Torso parts shoulders to waist only, lower parts waist to feet hem only. No actual head, arms, hands, legs, feet, weapons, assembled people. Complete silhouettes inside own cells, never touch cell edge; 60px gutters. Torso crop width and height roughly equal; lower robes taller than wide. Clear waist joint at top of lower part, centered. Flat filled graphic facets only 5-10 broad planes per piece, no tiny trim, no realism, no gradients, no background shadow or plates, no labels/grid/text. Actual transparent alpha background.
