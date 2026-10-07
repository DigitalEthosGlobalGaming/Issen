import test from 'node:test';
import assert from 'node:assert/strict';
import { createPhaseRouter, definePhase } from '../../src/game/session/phase-router.ts';
import { createEventBus } from '../../src/game/events.ts';

const phases = [
  'title',
  'playing',
  'boss',
  'between',
  'standoff',
  'shrine',
  'dead',
  'over',
  'paused',
];
function fixture(overrides = {}) {
  const context = { state: 'title', elapsed: 0, cuts: [], taps: 0 },
    trace = [],
    events = createEventBus();
  const controllers = Object.fromEntries(
    phases.map((name) => [
      name,
      definePhase({
        enter() {
          trace.push(`enter:${name}`);
        },
        exit() {
          trace.push(`exit:${name}`);
        },
        ...overrides[name],
      }),
    ]),
  );
  events.on('phaseChanged', ({ from, to }) => trace.push(`${from}->${to}:${context.state}`));
  const router = createPhaseRouter(
    context,
    {
      read: () => context.state,
      write: (next) => {
        context.state = next;
      },
      changed: (from, to) => events.emit('phaseChanged', { from, to }),
    },
    controllers,
  );
  return { context, trace, events, router };
}

test('phase dispatch routes live inputs and pauses without advancing the encounter', () => {
  const f = fixture({
    playing: {
      update(ctx, dt) {
        ctx.elapsed += dt;
      },
      onSwipe(ctx, dir) {
        ctx.cuts.push(dir);
      },
      onTap(ctx) {
        ctx.taps++;
      },
      onTapDown() {
        return true;
      },
    },
  });
  f.router.transition('playing');
  f.router.update(0.2);
  f.router.onSwipe('left');
  f.router.onTap();
  assert.equal(f.router.onTapDown(), true);
  f.router.transition('paused');
  f.router.update(10);
  f.router.onSwipe('right');
  f.router.onTap();
  assert.equal(f.router.onTapDown(), false);
  assert.equal(f.context.elapsed, 0.2);
  assert.deepEqual(f.context.cuts, ['left']);
  assert.equal(f.context.taps, 1);
  f.router.transition('playing');
  f.router.update(0.3);
  assert.equal(f.context.elapsed, 0.5);
});

test('transitions exit once, commit before the event, and enter once', () => {
  const f = fixture();
  f.router.transition('boss');
  f.router.transition('boss');
  assert.deepEqual(f.trace, ['exit:title', 'title->boss:boss', 'enter:boss']);
  assert.equal(f.router.active, 'boss');
  assert.throws(() => f.router.transition('missing'), /Undefined run phase/);
  assert.equal(f.context.state, 'boss');
  assert.equal(f.trace.length, 3);
});

test('checkpoint adoption dispatches the restored phase without repeating entry effects', () => {
  const f = fixture({
    shrine: {
      onTap(ctx) {
        ctx.taps++;
      },
    },
  });
  f.context.state = 'shrine';
  f.router.adoptCheckpoint();
  f.router.onTap();
  assert.equal(f.router.active, 'shrine');
  assert.equal(f.context.taps, 1);
  assert.deepEqual(f.trace, []);
});

test('direct migration writes are synchronized before and after a rule input', () => {
  const f = fixture({
    playing: {
      onSwipe(ctx) {
        ctx.state = 'between';
      },
    },
  });
  f.context.state = 'playing';
  f.router.onSwipe('up');
  assert.equal(f.router.active, 'between');
  assert.deepEqual(f.trace, [
    'exit:title',
    'title->playing:playing',
    'enter:playing',
    'exit:playing',
    'playing->between:between',
    'enter:between',
  ]);
});

test('a nested phase event enters only the final selected phase', () => {
  const f = fixture();
  f.events.on('phaseChanged', ({ to }) => {
    if (to === 'boss') f.router.transition('paused');
  });
  f.router.transition('boss');
  assert.equal(f.router.active, 'paused');
  assert.equal(f.context.state, 'paused');
  assert.deepEqual(f.trace, [
    'exit:title',
    'title->boss:boss',
    'exit:boss',
    'boss->paused:paused',
    'enter:paused',
  ]);
});
