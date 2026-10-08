import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrialObjective } from '../../src/ui/trial-objective.ts';

function fixture() {
  let hidden = true,
    text = '';
  const writes = [];
  const element = {
    get hidden() {
      return hidden;
    },
    set hidden(value) {
      writes.push(['hidden', value]);
      hidden = value;
    },
    get textContent() {
      return text;
    },
    set textContent(value) {
      writes.push(['text', value]);
      text = value;
    },
  };
  return {
    element,
    writes,
    objective: createTrialObjective(element),
    state: { state: 'playing', wave: 1, kills: 0, perfects: 0, bossesSlain: 0, boss: null },
  };
}

test('trial objectives write only on visibility or displayed progress changes', () => {
  const { objective, element, writes, state } = fixture();
  const trial = { name: 'Mirror', wave: { total: 8, perfects: 3 }, waveCount: 2, mirrored: true };
  objective.render(null, state);
  assert.deepEqual(writes, []);
  objective.render(trial, state);
  assert.equal(element.textContent, 'Mirror · Wave 1/2 · 0/8 cuts · 0/3 perfect · Cut opposite');
  assert.equal(writes.length, 2);
  for (let frame = 0; frame < 120; frame++) objective.render(trial, state);
  assert.equal(writes.length, 2);
  state.kills = 1;
  objective.render(trial, state);
  assert.equal(writes.length, 3);
  state.state = 'paused';
  objective.render(trial, state);
  objective.render(trial, state);
  assert.equal(writes.length, 4);
  assert.equal(element.hidden, true);
});

test('trial start/end and hiding reset selection without redundant writes', () => {
  const { objective, element, writes, state } = fixture();
  const trial = { name: 'Duels', bosses: [1, 2], cleanOpenings: true };
  objective.render(trial, state);
  assert.equal(element.textContent, 'Duels · 0/2 duels · No hits or missed openings');
  objective.hide();
  objective.hide();
  assert.equal(writes.length, 3);
  objective.render(null, state);
  assert.equal(writes.length, 3);
  objective.render(trial, state);
  assert.equal(writes.length, 4);
  objective.render({ ...trial, name: 'New duels' }, state);
  assert.equal(writes.length, 5);
  objective.render(null, state);
  assert.equal(writes.length, 6);
});

test('Duel Master exchanges update independently of wave progress', () => {
  const { objective, element, writes, state } = fixture();
  const trial = { name: 'Duel Master', duelMaster: true, bosses: [0] };
  state.state = 'boss';
  state.boss = { hp: 20 };
  objective.render(trial, state);
  assert.equal(element.textContent, 'Duel Master · 0/20 exchanges · No mistakes');
  state.kills++;
  objective.render(trial, state);
  assert.equal(writes.length, 2);
  state.boss.hp = 19;
  objective.render(trial, state);
  assert.equal(writes.length, 3);
  assert.equal(element.textContent, 'Duel Master · 1/20 exchanges · No mistakes');
});
