import { Filter, UniformGroup } from 'pixi.js';

export const sceneFilterVertex = `
in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
void main() {
  vec2 p = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  p.x = p.x * 2.0 / uOutputTexture.x - 1.0;
  p.y = p.y * 2.0 * uOutputTexture.z / uOutputTexture.y - uOutputTexture.z;
  gl_Position = vec4(p, 0.0, 1.0);
  vTextureCoord = aPosition * uOutputFrame.zw * uInputSize.zw;
}`;
const fragment = `
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform vec4 uInputSize;
uniform vec4 uInputClamp;
uniform vec2 uSceneSize;
uniform vec2 uLogicalSize;
uniform float uTime;
uniform float uMotion;
uniform float uGlitch;
out vec4 finalColor;
mediump float lum(mediump vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
mediump vec3 setLum(mediump vec3 c, mediump float l) {
  c += l - lum(c);
  float n = min(c.r, min(c.g, c.b)), x = max(c.r, max(c.g, c.b));
  if (n < 0.0) c = l + (c - l) * l / max(l - n, 0.00001);
  if (x > 1.0) c = l + (c - l) * (1.0 - l) / max(x - l, 0.00001);
  return c;
}
vec3 palette(float index) {
  float i = mod(index, 4.0);
  if (i < 1.0) return vec3(0.0, 1.0, 213.0 / 255.0);
  if (i < 2.0) return vec3(1.0, 25.0 / 255.0, 217.0 / 255.0);
  if (i < 3.0) return vec3(56.0 / 255.0, 34.0 / 255.0, 1.0);
  return vec3(216.0 / 255.0, 1.0, 0.0);
}
vec4 sampleScene(vec2 p) {
  return texture(uTexture, clamp(p * uSceneSize * uInputSize.zw, uInputClamp.xy, uInputClamp.zw));
}
mediump vec3 overlay(mediump vec3 base, mediump vec3 blend) {
  return mix(2.0 * base * blend, 1.0 - 2.0 * (1.0 - base) * (1.0 - blend), step(vec3(0.5), base));
}
vec4 stripPass(vec2 p) {
  float row = min(63.0, floor(p.y * 64.0));
  float shift = (0.005 * sin(row * 0.24 + uTime * 1.7) + 0.002 * sin(row * 0.71 - uTime * 2.3)) * uMotion;
  vec4 c = sampleScene(vec2(0.008 + shift + p.x * 0.984, p.y));
  mediump vec3 rgb = c.rgb / max(c.a, 0.0001);
  rgb = mix(rgb, setLum(palette(floor(p.y * 18.0) * 7.0), lum(rgb)), 0.32);
  return vec4(rgb * c.a, c.a);
}
void main() {
  vec2 p = vTextureCoord * uInputSize.xy / uSceneSize;
  if (uGlitch < 0.5) {
    vec4 c = texture(uTexture, vTextureCoord);
    mediump vec3 rgb = c.rgb / max(c.a, 0.0001);
    finalColor = vec4(mix(rgb, overlay(rgb, rgb), 0.55) * c.a, c.a);
    return;
  }
  vec4 c = stripPass(p);
  for (int j = 1; j < 12; j += 2) {
    float band = float(j), y = floor(band * uLogicalSize.y / 12.0);
    if (p.y * uLogicalSize.y >= y && p.y * uLogicalSize.y < y + max(1.0, floor(uLogicalSize.y / 90.0))) {
      float shift = (mod(band, 3.0) == 0.0 ? -0.035 : 0.025) * (0.7 + 0.3 * sin(uTime * 1.9 + band)) * uMotion;
      if (p.x - shift >= 0.0 && p.x - shift <= 1.0) c = mix(c, stripPass(vec2(p.x - shift, p.y)), 0.35);
    }
  }
  mediump vec3 rgb = c.rgb / max(c.a, 0.0001);
  if (mod(floor(p.y * uLogicalSize.y), 4.0) < 1.0) rgb = mix(rgb, overlay(rgb, vec3(7.0, 0.0, 21.0) / 255.0), 0.09);
  for (int j = 0; j < 24; ++j) {
    float b = float(j);
    vec2 origin = vec2(mod(b * 137.0, 997.0) / 997.0, mod(b * 263.0, 991.0) / 991.0);
    vec2 size = vec2(0.012 + mod(b, 4.0) * 0.008, max(1.0 / uLogicalSize.y, 0.003));
    if (all(greaterThanEqual(p, origin)) && all(lessThan(p, origin + size))) rgb = mix(rgb, 1.0 - (1.0 - rgb) * (1.0 - palette(b)), 0.3);
  }
  finalColor = vec4(rgb * c.a, c.a);
}`;

export function createCopyFilmPass() {
  const uniforms = new UniformGroup({
    uSceneSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    uLogicalSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    uTime: { value: 0, type: 'f32' },
    uMotion: { value: 1, type: 'f32' },
    uGlitch: { value: 0, type: 'f32' },
  });
  const filter = Filter.from({
    gl: { vertex: sceneFilterVertex, fragment, name: 'issen-film-copy' },
    resources: { filmUniforms: uniforms },
  });
  return {
    filter,
    update(
      film: string,
      width: number,
      height: number,
      time: number,
      reducedMotion: boolean,
      reducedFlashes: boolean,
      logicalWidth = width,
      logicalHeight = height,
    ) {
      uniforms.uniforms.uSceneSize[0] = width;
      uniforms.uniforms.uSceneSize[1] = height;
      uniforms.uniforms.uLogicalSize[0] = logicalWidth;
      uniforms.uniforms.uLogicalSize[1] = logicalHeight;
      uniforms.uniforms.uTime = reducedMotion || reducedFlashes ? 0 : time;
      uniforms.uniforms.uMotion = reducedMotion ? 0 : 1;
      uniforms.uniforms.uGlitch = film === 'trial-glitch' ? 1 : 0;
      uniforms.update();
    },
  };
}
