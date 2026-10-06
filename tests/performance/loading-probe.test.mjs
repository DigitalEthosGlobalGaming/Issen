import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { initLoadingProbe } from './loading-probe.mjs';

test('loading markers require prepared frames and preserve cancelled scene requests', () => {
  let now = 10,
    inspection = false;
  const probe = runInNewContext(`(${initLoadingProbe.toString()})()`, {
    performance: { now: () => now },
    document: { querySelector: () => inspection },
  });
  probe.frame('title', false);
  assert.equal(probe.firstCompleteTitleMs, null);
  probe.frame('title', true, false);
  assert.equal(probe.firstCompleteTitleMs, null);
  now = 20;
  probe.frame('title', true);
  now = 30;
  probe.frame('title', true);
  assert.equal(probe.firstCompleteTitleMs, 20);
  probe.beginScene(0);
  now = 40;
  probe.beginScene(1);
  now = 70;
  probe.sceneReady();
  const scenes = probe.snapshot().scenes;
  assert.equal(scenes[0].cancelled, true);
  assert.equal(scenes[0].latencyMs, null);
  assert.equal(scenes[1].latencyMs, 30);
  assert.equal(probe.submittedStage, null);
  probe.frame('title', false);
  assert.equal(probe.submittedStage, null);
  now = 80;
  probe.frame('title', true);
  assert.equal(probe.submittedStage, 1);
  assert.equal(probe.snapshot().scenes[1].submissionLatencyMs, 40);
  probe.beginPhase('inspection');
  probe.previewFrame('prevC', true);
  assert.equal(probe.readyPhases.inspection, undefined);
  inspection = true;
  probe.previewFrame('other', true);
  probe.previewFrame('prevC', false);
  assert.equal(probe.readyPhases.inspection, undefined);
  now = 90;
  probe.previewFrame('prevC', true);
  assert.equal(probe.snapshot().phases[0].latencyMs, 10);
});

test('decode counters retain outcomes without swallowing decode failures', async () => {
  let now = 0;
  class Image {
    src = 'fixture.png';
    async decode() {
      now += 5;
      if (this.fail) throw Error('decode failed');
    }
  }
  const probe = runInNewContext(`(${initLoadingProbe.toString()})()`, {
    performance: { now: () => now },
    HTMLImageElement: Image,
  });
  const image = new Image();
  await image.decode();
  image.fail = true;
  await assert.rejects(image.decode(), /decode failed/);
  assert.equal(probe.snapshot().explicitImageDecodes, 2);
  assert.equal(probe.snapshot().decodeMethodElapsedMs, 10);
  assert.equal(probe.snapshot().decodes[1].ok, false);
});
