import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeafMotion, leafMotionPose } from '../../src/rendering/scene/leaf-motion.ts';
import { createAmbient } from '../../src/rendering/scene/ambient.ts';
import { rng } from '../../src/shared/random.ts';

test('analytic leaf motion agrees with the original small-step fall, wind, spin and flutter without mutating spawn parameters', () => {
  const motion = createLeafMotion();
  const leaf = {
    x: 20,
    y: 150,
    z: 0.8,
    s: 8,
    rot: 0.3,
    vr: 1.4,
    fl: 0.2,
    vf: 3,
    vy: 6,
    ph: 0.7,
    col: '#fff',
    gust: 1,
    rise: 12,
    spin: 0.7,
    flutter: 0.6,
  };
  const before = structuredClone(leaf),
    birth = motion.register(leaf),
    step = 1 / 1000;
  let x = leaf.x,
    y = leaf.y,
    rot = leaf.rot,
    fl = leaf.fl;
  for (let i = 1; i <= 1000; i++) {
    const time = i * step,
      wind = i <= 500 ? 0.3 : 0.8;
    motion.advance(step, time, wind);
    x += (40 + 95 * wind) * leaf.z * step * 1.2 * 3.2;
    y +=
      (leaf.vy + Math.sin(time * 1.7 + leaf.ph) * 26) * leaf.z * step * 0.6 * 1.2 -
      leaf.rise * step * 1.2;
    rot += leaf.vr * step * leaf.spin;
    fl += leaf.vf * step;
  }
  const pose = leafMotionPose(leaf, birth, motion.clock, 1.2, true);
  assert.ok(Math.abs(pose.x - x) < 1e-8);
  assert.ok(Math.abs(pose.y - y) < 0.02);
  assert.ok(Math.abs(pose.rot - rot) < 1e-8);
  assert.ok(Math.abs(pose.flatten - (1 - leaf.flutter + leaf.flutter * Math.cos(fl))) < 1e-8);
  assert.deepEqual(leaf, before);
});

test('leaf draws do not advance clocks or consume randomness and birth clocks isolate late gusts', () => {
  const motion = createLeafMotion();
  const leaf = { x: 20, y: 30, z: 1, s: 8, rot: 0, vr: 1, fl: 0, vf: 2, vy: 0, ph: 0, col: '#fff' };
  const first = motion.register(leaf);
  motion.advance(0.5, 0.5, 0.4);
  const gust = { ...leaf, gust: 1 },
    late = motion.register(gust);
  const clock = { ...motion.clock };
  const pose = leafMotionPose(gust, late, motion.clock, 1, true);
  assert.equal(pose.x, gust.x);
  assert.equal(pose.y, gust.y);
  for (let i = 0; i < 10; i++) leafMotionPose(leaf, first, motion.clock, 1, true);
  assert.deepEqual(motion.clock, clock);
  assert.equal(motion.birth(gust), late);
});

test('ambient lifetime sweeps respawn ordinary leaves, retire gusts, and preserve uploaded spawn data between sweeps', () => {
  const motion = createLeafMotion(),
    ambient = createAmbient({
      width: 390,
      height: 844,
      scale: 1,
      layout: { groundY: 650, eH: 160 },
      random: rng(42),
      motion,
      spriteMotion: true,
    });
  const leaves = ambient.buildLeaves();
  const old = leaves[0];
  old.x = 1000;
  ambient.gustLeaves(leaves, 2);
  for (const leaf of leaves) if (leaf.gust) leaf.x = 1000;
  const count = leaves.length - 2;
  ambient.updateLeaves(leaves, 0.01, 0.01, 0.5);
  assert.equal(leaves.length, count);
  assert.notEqual(leaves[0], old);
  const before = structuredClone(leaves),
    revision = motion.revision;
  ambient.updateLeaves(leaves, 0.01, 0.02, 0.5);
  assert.deepEqual(leaves, before);
  assert.equal(motion.revision, revision);
  assert.ok(motion.clock.elapsed > 0.01);
});
