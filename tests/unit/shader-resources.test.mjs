import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLightTargetBinding,
  setShaderResource,
} from '../../src/rendering/pixi/shader-resources.ts';

test('light detach is a no-op until attachment and repeated unchanged bindings never write', () => {
  const empty = {},
    values = { uLightDiffuse: empty, uLightSpecular: empty, uLightGuide: empty };
  const writes = [];
  const resources = new Proxy(values, {
    set(target, name, value) {
      writes.push(name);
      target[name] = value;
      return true;
    },
  });
  const binding = createLightTargetBinding(resources, empty);
  binding.detach();
  assert.equal(writes.length, 0);
  const targets = { diffuse: { source: {} }, specular: { source: {} }, guide: { source: {} } };
  binding.attach(targets);
  assert.equal(writes.length, 3);
  binding.attach(targets);
  assert.equal(writes.length, 3);
  binding.attach({ ...targets, guide: { source: {} } });
  assert.equal(writes.length, 4);
  binding.detach();
  assert.equal(writes.length, 7);
  binding.detach();
  assert.equal(writes.length, 7);
  assert.equal(values.uLightGuide, empty);
});

test('change-only resources still adopt replacements after release', () => {
  let value,
    writes = 0;
  const resources = {
    get source() {
      return value;
    },
    set source(next) {
      writes++;
      value = next;
    },
  };
  const first = {},
    second = {};
  setShaderResource(resources, 'source', first);
  setShaderResource(resources, 'source', first);
  setShaderResource(resources, 'source', second);
  setShaderResource(resources, 'source', first);
  assert.equal(writes, 3);
  assert.equal(resources.source, first);
});
