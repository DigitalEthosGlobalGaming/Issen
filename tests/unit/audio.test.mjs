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
    audio.setPaused(true);
    assert.deepEqual(ambience.gain.events.at(-1), ['target', 0]);
    const pausedEvents = ambience.gain.events.length;
    audio.setPaused(true);
    assert.equal(ambience.gain.events.length, pausedEvents);
    const before = nodes.length;
    audio.update(10, 'night', 1, 0);
    assert.equal(nodes.length, before);
    audio.setPaused(false);
    assert.deepEqual(ambience.gain.events.at(-1), ['target', 1]);
    const resumedEvents = ambience.gain.events.length;
    audio.setPaused(false);
    assert.equal(ambience.gain.events.length, resumedEvents);
    audio.update(1, 'night', 1, 0);
    assert.equal(nodes.filter((node) => node.kind === 'noise').length, 1);
    const weatherTones = nodes.filter((node) => node.kind === 'tone');
    assert.ok(weatherTones.length > 0);
    assert.ok(weatherTones.every((node) => node.destination.destination === ambience));
    await audio.dispose();
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
