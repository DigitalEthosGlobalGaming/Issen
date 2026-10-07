# Refactor decision log

- 2026-10-07 — preparation — use `pre-refactor` at `ad353b3` as the immutable restore point; work directly on `develop` — dated restore branch — requested name was available and develop matched origin — restore from that branch without rewriting history.
- 2026-10-07 — W1 audit — preserve base artwork and diffuse separately, plus all authoring PNGs — selecting just one colour plane — both have consumers and original art must survive — remove compact runtime siblings and restore URL references.
- 2026-10-07 — W1 conversion — use Python/Pillow through `scripts/assets/compact.mjs`, with `ISSEN_PYTHON` selecting the interpreter — adding sharp — existing PBR installer already requires Pillow; method-6 WebP supports exact data and alpha checks — revert the asset tool commit; original copies live under ignored `tmp/asset-compaction/originals/`.
- 2026-10-07 — W1 conversion — tune colour quality through 90, 95, 98, 100, then lossless when needed — relaxing colour tolerances — preserve mean <= 0.5, maximum <= 8 and exact alpha — re-encode from original copies with the same validation.
- 2026-10-07 — W1 audit — existing build/APK sizes are inventory only; matched projections require fresh verification web builds — comparing stale generated outputs — stale outputs cannot establish compression gains and store builds are excluded — replace estimates with final verified bundle accounting.

## Future work

- Consider GPU compressed formats only after texture-preparation consumers can support them. No profiling is authorized in this refactor.
