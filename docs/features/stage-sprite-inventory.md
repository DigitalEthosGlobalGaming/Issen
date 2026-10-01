# Stage sprite inventory

Status: implemented inventory, updated 2026-10-01 for version 1.17.0.
All nine scenes use their dedicated composition. The original planning targets
below remain useful for future reuse; the implementation table is authoritative.

Use with the [stage art plan](stage-art-plan.md), which owns scene descriptions
and composition. This inventory owns the shared asset list and scene mapping.
The existing [asset provenance](../../src/rendering/environment/assets/README.md)
records generated sources. The [visual asset library](environment-asset-library.md)
documents actual dimensions, cell contents, anchors, packing limitations, and
implemented reuse. Last Light Ridge now uses E01, E02, E04, E05, and E06;
the table below records the complete implemented scene kits.

## Implemented kits

| Scene | Existing assets used | New assets used |
| --- | --- | --- |
| Field | E01/E02/E04-E10 | None |
| Ridge | E01/E02/E04/E05/E06 | None |
| Blossom | E01/E04/E05/E06 | N01/N02 |
| Hollow | E01/E02/E04/E05/E06/E08 | N03 |
| Bamboo | E01/E03/E04/E06 | N04 |
| Snow | E01 | N06/N07/N08 and standalone snow-peak.png (1.17.1) |
| Temple | E01/E02/E06 | N09/N10/N11/N12 |
| Shore | E01/E02/E04/E06/E07 | N13/N14 |
| Moonwatch | E01/E02/E06/E10 | N09/N12 |

N01-N04 and N06-N14 are generated and integrated (13 new atlases, 24 total).
N05 stumps and N15 separate moon landmark are deferred: fallen bamboo and the
shared temple gate/steps cover those needs. Snow sheets are complete variants,
not registered overlays. Temple sheets require explicit variable-width frames.
See the [asset library](environment-asset-library.md) and linked per-atlas contracts
for actual packing, source windows, contact anchors and generation provenance.

## Scene key

| Number | Planned scene |
| --- | --- |
| 1 | The Whispering Field |
| 2 | Last Light Ridge |
| 3 | The Falling Blossom Path |
| 4 | Rainwater Hollow |
| 5 | The Hollow Bamboo Road |
| 6 | White Silence Pass |
| 7 | The Ember Courtyard |
| 8 | The Broken Shore |
| 9 | The Moonwatch Clearing |

Scene numbers below refer to this order, not zero-based code indices. Suggested
reuse does not mean that a scene already renders those assets.

## Existing shared library

Files live in src/rendering/environment/assets/. These eleven atlases exist;
each contains four cells. Inspect the images before assigning an individual cell
to a new role. Preserve the foreground sheet's explicit frame rectangles rather
than assuming every sheet divides into equal integer-height cells.

| ID | Existing atlas | Contents | Planned scenes and role |
| --- | --- | --- | --- |
| E01 | mountain-atlas.png | Four ridge silhouettes | 1 layered distance; 2 dominant ridge and valley; 3 faint orchard backdrop; 4 barely visible skyline; 5 glimpses through bamboo; 6 peak and saddle; 8 distant headlands; 9 a single quiet ridge |
| E02 | pine-atlas.png | Four windswept pine variations | 1 scattered treeline; 2 sparse hillside group; 4 rain-obscured boundary; 6 selected snow variants; 7 beyond temple walls; 8 isolated coastal tree; 9 widely spaced silhouettes |
| E03 | bamboo-atlas.png | Four upright bamboo clumps | 5 dense edge framing and smaller distant groups; avoid repeating this kit as the defining background of unrelated stages |
| E04 | field-banks-atlas.png | Four low earth banks | 1 rolling field; 2 hillside; 3 path borders; 4 grassy islands; 5 road margins; 6 snow-covered terrain bases; 7 raised foundations; 8 coastal ground shelf; 9 subdued ground contours |
| E05 | shrubs-atlas.png | Four sparse shrub groups | 1, 2, 3 and 4 ground variation; 5 sparse undergrowth; 8 coastal scrub; 9 occasional silhouettes. Omit where the snowy or ruined composition needs cleaner space |
| E06 | field-rocks-atlas.png | Four low rock clusters | 1, 2 and 3 scattered stones; 4 puddle margins; 5 bamboo road; 6 exposed snow rocks; 7 rubble; 8 shore clusters; 9 landmark base |
| E07 | foreground-boulders-atlas.png | Fractured boulder, split slab, sloped wedge, compact crag | 1 established lower-right anchors; 2 ridge edge; 5 occasional edge anchor; 6 snow variants; 7 larger debris; 8 prominent shoreline rocks; 9 isolated foreground silhouette |
| E08 | grass-edges-atlas.png | Four broken grass fringe strips | 1 meadow transition; 2 hillside edge; 3 path fringe; 4 puddle boundaries; 5 sparse margins; 8 coastal grass boundary; 9 moonlit clearing |
| E09 | meadow-patches-atlas.png | Four flattened meadow textures | 1 ground transition; 2 open hillside; 3 orchard ground; 4 raised dry patches; 5 occasional clearing patch; 9 sparse ground detail |
| E10 | fog-wisps-atlas.png | Four pale translucent wisps | 1 and 2 valley haze; 3 orchard mist; 4 rain haze; 5 bamboo depth; 6 snow haze; 7 supporting smoke if shapes fit; 8 supporting spray haze; 9 low mist |
| E11 | rocks-atlas.png | Older mixed rocks/grass/boulder/rubble sheet | Existing prototype/supporting library. Reuse a cell only if it fits; prefer E06/E07 for consistent new rock compositions. Do not regenerate this mixed family automatically |

E01 and E04 are overlapping silhouettes, not guaranteed seamless textures.
Reusing E01 as a headland means placing it in distant perspective, not stretching
it into a foreground cliff. Snow, wetness, and ash treatments must preserve the
base object's shape and readable values.

## Proposed vegetation and ground additions

Each row is an object family, normally one separate atlas. Suggested filenames
are original planning targets; status and actual files are recorded above.

| ID | Proposed atlas | Target variations | Scene use and composition contract |
| --- | --- | --- | --- |
| N01 | cherry-trees-atlas.png | 4: broad leaning tree, upright open canopy, low spreading tree, sparse smaller tree | 3. Complete tree silhouettes; one can be enlarged and cropped by the viewport for edge framing. Smaller variants recede into the orchard. Keep foliage gaps and a readable trunk |
| N02 | petal-ground-atlas.png | 4: thin scatter, crescent drift, dense shallow patch, broken narrow strip | 3. Flat ground deposits with soft irregular edges, separate from airborne petals and path geometry |
| N03 | reeds-atlas.png | 4: short sparse tuft, tall upright clump, leaning clump, broken low fringe | 4 primarily; sparse sheltered coastal use in 8 only if visually plausible. Grounded cutouts, no baked water or reflections |
| N04 | fallen-bamboo-atlas.png | 3: single broken culm, crossed pair, small low bundle | 5, conditional on existing assets being insufficient. Side-view grounded forms with visible broken ends; no attached upright foliage |
| N05 | bamboo-stumps-atlas.png | 3: single cut stump, uneven small cluster, splintered stump | 5, conditional. Separate low objects rather than including them inside upright tree cells |

N04 and N05 can share a production batch but should remain separately identified
families with independent frames. They are not a reason to force unrelated
objects into the same generated sheet.

## Proposed snow treatments

Choose fitted transparent overlays or complete derived sprite variants after
a visual trial. Do not produce both approaches by default. Snow must sit on
specific surfaces; a generic white patch cannot reliably fit every tree or rock.

| ID | Proposed family | Initial target | Base and intended use |
| --- | --- | --- | --- |
| N06 | Snow-covered pines | 2 selected tree variations | E02, scene 6. Snow on upper branches, with dark trunk and foliage still readable |
| N07 | Snow-covered boulders | 2 selected boulder variations | E07, scene 6. Upper-surface accumulation, exposed dark sides and stable ground anchors |
| N08 | Snow-covered low rocks | 2 selected cluster variations | E06, scene 6. Broken exposed stones within snow; useful near the combat ground without crowding it |

Snow drifts initially use E04 silhouettes with a rendered snow surface. Create
a dedicated drift atlas only if that approach fails to produce convincing
accumulation; it is not part of the initial image batch. Existing mountain
facets can receive a controlled snow treatment without requiring a duplicate
mountain atlas.

Every derived frame must identify its source cell. Overlays require matching
frame dimensions, pivot, scale, and orientation; full variants should retain
compatible ground anchors. Never silently trim registration padding.

## Proposed architecture and coastal additions

Use separate object-family atlases for architecture rather than one packed
illustration of an entire temple. This enables scene 7 to be assembled differently
and selected intact pieces to support scene 9.

| ID | Proposed atlas/family | Target variations | Scene use and composition contract |
| --- | --- | --- | --- |
| N09 | temple-posts-atlas.png | 4: intact upright, cracked upright, broken upright, fallen beam | 7 gate and courtyard framing; intact pieces may support 9. Common material, thickness family, and identifiable connection points |
| N10 | temple-walls-atlas.png | 3: low intact span, breached span, broken end section | 7 low boundaries. Compatible base height and end treatment; do not claim seamless joins until inspected |
| N11 | temple-roofs-atlas.png | 3: short eave section, damaged roof span, fallen roof fragment | 7 offset distant roofline and limited debris. Consistent roof pitch and perspective, separate from fire and smoke |
| N12 | temple-steps-atlas.png | 3: short broad flight, worn narrow flight, broken landing | 7 foundations; 9 possible landmark base. Shared viewing angle and clear ground contact |
| N13 | sea-stacks-atlas.png | 3: tall split pillar, squat isolated crag, paired narrow stacks | 8 offshore silhouettes. Clear dry rock shapes without baked waves or horizon; use E06/E07 for ordinary near-shore rocks |
| N14 | foam-strips-atlas.png | 4: thin broken edge, broad wash, curved rock-edge foam, fragmented receding foam | 8. Transparent shallow strips without dark water rectangles; independent placements, not an assumed animation sequence or seamless tile |
| N15 | moonwatch-landmark.png | At most 1 intact small shrine or gate | 9, conditional. First try N09/N12; choose shrine or gate at composition review rather than generating both |

Natural rock sprites provide the initial temple rubble. A new masonry-debris
atlas is outside the initial batch unless the assembled courtyard clearly needs
recognisable broken tiles or masonry.

The near coastal shelf initially combines ground rendering and existing banks
and boulders. Assess it in composition before commissioning an additional cliff
atlas.

## Elements to keep in rendering

These are part of the scene inventory, but are not requests for new static PNG
atlases. Existing behavior should be retained where suitable; proposed additions
remain unimplemented.

| Element | Scene use | Approach |
| --- | --- | --- |
| Static and animated grass | Especially 1; adapted density elsewhere | Preserve current procedural/Canvas grass. Ground sprites supplement it rather than replace it |
| Sky, sun, moon, broad clouds | All stages as appropriate | Retain procedural layers and stage parameters |
| Curving path / road surface | 3 and 5 | Render terrain shapes beneath scattered edges and ground details |
| Puddles, water masks, ripples, reflections | 4 | Proposed shallow-water rendering; banks and reeds stay separate |
| Snow surface and drifting snow | 6 | Terrain treatment plus existing snow particles; fitted object snow comes from N06–N08 |
| Rain, windblown leaves, airborne petals | Relevant existing weather stages | Reuse existing particle/weather renderers, adjusting presentation only as needed |
| Firelight, embers, smoke motion | 7 | Separate rendered effects; existing smoke and suitable E10 wisps can support them. A dedicated smoke sprite is conditional, not committed |
| Sea surface, wave movement, spray | 8 | Proposed water/effects rendering with N14 foam sprites and static rocks |
| Depth fog, film grading, vignette | All | Shared rendering passes; keep final film looks out of base images |

No new gameplay occlusion rules or hazards are implied by these visual elements.

## Scene production checklist

| Scene | Reuse first | Initial additions / decisions |
| --- | --- | --- |
| 1 — Field | Established field set E01/E02/E04–E10 | None; preserve current grass and finished composition |
| 2 — Ridge | E01/E02/E04–E10, with fewer layers and asymmetric placement | None expected |
| 3 — Blossom | E01/E04/E05/E06/E08/E09/E10 | N01, N02; rendered path |
| 4 — Hollow | E01/E02/E04/E05/E06/E08/E09/E10 | N03; shallow water rendering |
| 5 — Bamboo | E03/E04/E06/E07/E08/E09/E10; optional E01 glimpse and suitable E11 cells | Evaluate N04/N05; rendered road |
| 6 — Snow | E01/E02/E04/E06/E07/E10 | N06/N07/N08; rendered snow terrain |
| 7 — Temple | E02/E04/E06/E07, suitable E10 haze | N09–N12; separate firelight and smoke |
| 8 — Shore | E01/E02/E04/E05/E06/E07/E08/E10 | N13/N14; sea rendering, optional existing N03 reeds |
| 9 — Moonwatch | E01/E02/E04/E05/E06/E07/E08/E09/E10 | Reuse N09/N12 where suitable; N15 only if needed |

## Production rules and tracking

Start with the eleven existing atlases. The proposed list contains twelve core
families/treatments (N01–N03 and N06–N14), plus three conditional families
(N04, N05, N15). Counts are initial scope estimates, not instructions to generate
all sheets before reviewing any scene. Atlas sizes and cell arrangements remain
undecided until the intended screen scale and object proportions are known.

Keep charcoal/gray/ivory values, angular facets, rough ink texture, genuine
transparent exteriors, and consistent lighting. New assets should work at their
intended display size and under multiple film looks. Scene-wide mist, figures,
text, and UI must not be baked into object atlases.

Record source image, actual dimensions, named pixel rectangles, ground anchors,
allowed transforms, and provenance when a family is produced. Variations are not
animation frames. Respect complete silhouettes, gutters, and filtering margins.
Retain originals and verify derived snow registration.

During future production, mark each N entry as proposed, generated, integrated,
or visually accepted, with the actual filename and scene usage. Keep fallback
and conditional decisions explicit. Version 1.17.0 implements these kits and names without changing gameplay.
