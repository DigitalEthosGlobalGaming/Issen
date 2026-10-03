import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../../src/audio/audio.ts';

test('landing cue is a short low impact with restrained metal and finite envelopes', async () => {
  const nodes = [];
  const param = () => ({
    value: 0,
    events: [],
    setValueAtTime(value, time) {
      this.events.push([value, time]);
    },
    exponentialRampToValueAtTime(value, time) {
      this.events.push([value, time]);
    },
  });
  class Context {
    currentTime = 1;
    sampleRate = 100;
    destination = {};
    node(kind) {
      const node = {
        kind,
        gain: param(),
        frequency: param(),
        Q: param(),
        connect() {},
        start() {},
        stop(time) {
          this.stopAt = time;
        },
      };
      nodes.push(node);
      return node;
    }
    createGain() {
      return this.node('gain');
    }
    createDynamicsCompressor() {
      return this.node('compressor');
    }
    createBufferSource() {
      return this.node('noise');
    }
    createBiquadFilter() {
      return this.node('filter');
    }
    createOscillator() {
      return this.node('tone');
    }
    createBuffer(channels, length) {
      return { getChannelData: () => new Float32Array(length) };
    }
    close() {
      return Promise.resolve();
    }
  }
  const previous = globalThis.window;
  globalThis.window = { AudioContext: Context };
  try {
    const audio = createAudio(false);
    audio.init();
    const master = nodes.find((node) => node.kind === 'gain');
    nodes.length = 0;
    audio.cues.clink();
    const tones = nodes.filter((n) => n.kind === 'tone');
    assert.equal(tones.length, 2);
    assert.deepEqual(
      tones.map((n) => n.frequency.events[0][0]),
      [125, 2150],
    );
    const voices = nodes.filter((n) => n.kind === 'tone' || n.kind === 'noise');
    assert.equal(voices.length, 4);
    assert.ok(voices.every((n) => n.stopAt <= 1.16));
    const gains = nodes.filter((n) => n.kind === 'gain');
    assert.ok(gains.reduce((total, n) => total + n.gain.events[1][0], 0) < 0.5);
    for (const n of nodes)
      for (const p of [n.gain, n.frequency])
        assert.ok(p.events.flat().every((value) => Number.isFinite(value) && value > 0));
    nodes.length = 0;
    audio.cues.reveal();
    assert.equal(nodes.filter((node) => node.kind === 'tone').length, 2);
    assert.ok(nodes.filter((node) => node.kind === 'tone').every((node) => node.stopAt < 1.42));
    audio.setMuted(true);
    assert.equal(master.gain.value, 0);
    await audio.dispose();
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('pausing fades a single ambience source and does not schedule weather accents', async () => {
  const nodes = [];
  const param = () => ({
    value: 0,
    events: [],
    setValueAtTime(value) {
      this.events.push(['set', value]);
    },
    setTargetAtTime(value) {
      this.events.push(['target', value]);
    },
    exponentialRampToValueAtTime(value) {
      this.events.push(['ramp', value]);
    },
    cancelScheduledValues() {
      this.events.push(['cancel']);
    },
  });
  class Context {
    currentTime = 1;
    state = 'running';
    suspend() {
      this.state = 'suspended';
      return Promise.resolve();
    }
    resume() {
      this.state = 'running';
      return Promise.resolve();
    }
    sampleRate = 100;
    destination = {};
    node(kind) {
      const node = {
        kind,
        gain: param(),
        frequency: param(),
        Q: param(),
        connect(target) {
          this.destination = target;
        },
        start() {},
        disconnect() {},
        stop() {},
      };
      nodes.push(node);
      return node;
    }
    createGain() {
      return this.node('gain');
    }
    createDynamicsCompressor() {
      return this.node('compressor');
    }
    createBufferSource() {
      return this.node('noise');
    }
    createBiquadFilter() {
      return this.node('filter');
    }
    createOscillator() {
      return this.node('tone');
    }
    createBuffer(channels, length) {
      return { getChannelData: () => new Float32Array(length) };
    }
    close() {
      return Promise.resolve();
    }
  }
  const previous = globalThis.window;
  globalThis.window = { AudioContext: Context };
  try {
    const audio = createAudio(false);
    audio.init();
    const loopSource = nodes.find((node) => node.kind === 'noise');
    const ambience = loopSource.destination.destination.destination;
    assert.equal(ambience.kind, 'gain');
    audio.setVolumes(0.25, 0.4);
    assert.deepEqual(ambience.gain.events.at(-1), ['target', 0.4]);
    audio.cues.clink();
    const effects = nodes.find((node) => node.kind === 'tone').destination.destination;
    assert.equal(effects.gain.value, 0.25);
    audio.setMuted(true);
    assert.equal(effects.gain.value, 0.25, 'muting preserves channel volumes');
    audio.setMuted(false);
    const noiseBeforePause = nodes.filter((node) => node.kind === 'noise').length;
    const tonesBeforePause = nodes.filter((node) => node.kind === 'tone').length;
    audio.setPaused(true);
    assert.deepEqual(ambience.gain.events.at(-1), ['target', 0]);
    const pausedEvents = ambience.gain.events.length;
    audio.setPaused(true);
    assert.equal(ambience.gain.events.length, pausedEvents);
    const before = nodes.length;
    audio.update(10, 'night', 1, 0);
    assert.equal(nodes.length, before);
    audio.setPaused(false);
    assert.deepEqual(ambience.gain.events.at(-1), ['target', 0.4]);
    const resumedEvents = ambience.gain.events.length;
    audio.setPaused(false);
    assert.equal(ambience.gain.events.length, resumedEvents);
    audio.update(1, 'night', 1, 0);
    assert.equal(nodes.filter((node) => node.kind === 'noise').length, noiseBeforePause);
    const weatherTones = nodes.filter((node) => node.kind === 'tone').slice(tonesBeforePause);
    assert.ok(weatherTones.length > 0);
    assert.ok(weatherTones.every((node) => node.destination.destination === ambience));
    const master = nodes.find((node) => node.kind === 'gain');
    audio.setInactive(true);
    assert.equal(master.gain.value, 0);
    const hiddenNodes = nodes.length;
    audio.cues.drum();
    audio.init();
    audio.setMuted(false);
    audio.update(20, 'night', 1, 0);
    assert.equal(nodes.length, hiddenNodes);
    assert.equal(master.gain.value, 0);
    audio.setMuted(true);
    audio.setPaused(true);
    audio.setInactive(false);
    assert.equal(master.gain.value, 0, 'foregrounding preserves mute');
    assert.deepEqual(ambience.gain.events.at(-1), ['target', 0], 'foregrounding preserves pause');
    audio.setMuted(false);
    assert.equal(master.gain.value, 0.9);
    await audio.dispose();
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
