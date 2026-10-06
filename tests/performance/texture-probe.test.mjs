import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { initTextureProbe } from './texture-probe.mjs';

test('texture counters retain current mip extents without summing overwritten allocations', () => {
  const result = runInNewContext(
    `
 class WebGLRenderingContext {
  constructor() {this.canvas={id:'game'};this.lost=false;}
  isContextLost() {return this.lost;}
  createTexture() {return {};}
  bindTexture() {} deleteTexture() {} texImage2D() {} texSubImage2D() {} texStorage2D() {}
 }
 Object.assign(globalThis,{WebGLRenderingContext});
 const probe=(${initTextureProbe.toString()})();
 const gl=new WebGLRenderingContext();
 const untouched=gl.createTexture();
 const before=probe.snapshot(); probe.install(); probe.install();
 const a=gl.createTexture();gl.bindTexture(3553,a);
 gl.texImage2D(3553,0,6408,10,20,0,6408,5121,null);
 gl.texImage2D(3553,0,6408,4,5,0,6408,5121,new Uint8Array(80));
 gl.texSubImage2D(3553,0,0,0,6408,5121,{width:2,height:3});
 const allocated=probe.snapshot();
 gl.deleteTexture(a);gl.deleteTexture(a);
 const b=gl.createTexture();gl.bindTexture(3553,b);gl.texStorage2D(3553,3,32856,8,8);
 const mips=probe.snapshot();gl.lost=true;
 JSON.stringify({before,allocated,mips,lost:probe.snapshot()});
 `,
    { WeakRef, Proxy, Reflect, URLSearchParams },
  );
  const { before, allocated, mips, lost } = JSON.parse(result);
  assert.equal(before.installed, false);
  assert.equal(before.created, 0);
  assert.equal(allocated.allocationCalls, 2);
  assert.equal(allocated.nominalRgbaPixels, 20);
  assert.equal(allocated.uploadCalls, 2);
  assert.equal(allocated.uploadedPixels, 26);
  assert.equal(mips.allocationCalls, 3);
  assert.equal(mips.deleted, 1);
  assert.equal(mips.created, 2);
  assert.equal(mips.nominalRgbaPixels, 84);
  assert.equal(mips.surfaces[0].name, 'game');
  assert.equal(lost.activeTextures, 0);
  assert.equal(lost.nominalRgbaPixels, 0);
});
