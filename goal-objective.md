Goal: Finish Issen’s mobile performance and seamless transitions
Work on develop in DigitalEthosGlobalGaming/Issen. Read AGENTS.md, current-development-status.md and main-goal.md first. Continue from the current checkpoint, reusing completed work and compatible baselines. Do not resume cancelled work.
Objectives
- Smooth gameplay, targeting 120 Hz: frame-time p95 below 8.3 ms, with frames above 16.7 ms rare and explained.
- Near-instant prepared stage changes; cold changes remain responsive and no slower than baseline.
- Bounded whole-app decoded-image and GPU memory throughout an all-stage run.
- Substantially cheaper drifting leaves, petals, debris and embers.
Implementation
1. Optimize drift sprites.
   - Measure debug-only off/current/new modes in calm and gust scenes.
   - Merge the four families into one padded, mipmapped atlas. Start at 128 px per frame; use 192 only if visual review justifies it.
   - Use reproducible, alpha-aware downsampling, appropriate WebP outputs and drift-only trilinear filtering. Preserve authoring sources.
   - Keep instancing and draw sprites once through a cheap composite lighting path, without geometry-buffer writes or normal/surface sampling.
   - Preserve coherent tint, opacity, flutter, ordering and glowing embers, with sensible lighting over empty backgrounds.
   - Use the cheap path by default. Keep full PBR only at the highest desktop quality if its visible benefit justifies the cost.
   - Target roughly 90% less drift texture memory and substantially lower rendering cost. Report opportunities outside drift separately.
2. Simplify worker execution.
   - Require worker-based scenery preparation on supported platforms; verify intended browser and Android WebView capabilities.
   - Replace automatic local fallback with clear failure reporting and retry/recovery.
   - Remove unused fallback-only code while retaining shared composition logic.
3. Complete seamless transitions and resource preparation.
   - Implement budget-aware next-scene composition, texture warming and promotion.
   - Prepare incoming enemy and weapon variants through the existing gameplay renderer.
   - Handle cancellation, hidden/busy states, resize, DPR, quality changes, context restoration and disposal.
   - Finish remaining asset ownership and account for combined main-thread, worker, canvas, copied-image and GPU memory. Release unused resources.
   - Bring stage composition below approximately 500 ms, or profile and explain the remaining cost.
Guardrails
Protect the game’s feel, readability and reliability: its ink-art identity, atmosphere, responsive combat and clear gameplay cues.
Lighting methods, texture detail, effects and rendering implementations may change to improve performance. Exact pixel parity is unnecessary for intentional visual changes. Judge them through representative gameplay and visual comparisons.
Keep existing modes, including Demon Mirror and Inferno, playable and coherent. Preserve saves, gameplay rules, run determinism, accessibility settings and Android offline play. Background work must yield and respect frame and memory budgets.
Follow repository versioning, changelog and documentation conventions. Commit coherent, reviewable changes. Reject and briefly document unsuccessful experiments.
Working and testing cadence
- Finish usable feature chunks before extensive polishing or measurement.
- Select the smallest relevant verification set for each chunk. Once it passes, move on unless a concrete concern remains.
- Reserve full suites for major integration checkpoints and final verification. Do not rerun passing checks on unchanged code or duplicate build/type-check steps already covered by another command.
- Extend existing tests for meaningful behavior and failure risks. Avoid elaborate new harnesses where existing tools suffice.
- Use representative screenshots for intentional visual changes; exact comparisons only where output should remain identical.
- Use targeted performance samples during iteration. Run the complete measurement matrix once the implementation is stable.
- Before additional profiling, identify the question and how its answer could change the implementation.
- Time-box investigations. After two unsuccessful approaches, reassess priority and move on unless the issue blocks completion.
- Diagnose failures with focused reruns; avoid unrelated cleanup.
- Parallelize independent reads and lightweight checks. Keep graphics tests and performance captures isolated from competing workloads.
- Keep progress notes brief and continue autonomously after recording checkpoints.
Use three substantial checkpoints: drift optimization, transition/resource integration, and final verification.
Completion and reporting
Compare startup, gameplay, cold/warm transitions, composition and all-stage memory against compatible baselines. Target no main-thread tasks above 16 ms during the first two seconds after stage presentation.
Review drift visuals in daylight, darkness/lantern light, fire and gusts. Verify resize/DPR, context restoration, low quality/density, reduced motion/flashes, cinematic preview and worker failure/recovery.
Run all applicable suites at final verification. Distinguish CPU render time from actual frame delivery and emulation from physical-device evidence. If available hardware cannot prove a target, finish the implementable work and clearly report the gap; do not repeatedly benchmark an unsuitable environment or claim an unproven target is met.
Provide a concise final report with before/after measurements, memory budgets, drift texture savings, screenshots, worker recovery behavior, rejected experiments and remaining limitations.