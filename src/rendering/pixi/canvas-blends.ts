import { extensions, ExtensionType, Filter, GlProgram } from 'pixi.js';
import { sceneFilterVertex } from './film-pass.ts';

const functions = `
float luminance(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
vec3 setLuminance(vec3 c, float l) {
  c += l - luminance(c);
  float low = min(c.r, min(c.g, c.b)), high = max(c.r, max(c.g, c.b));
  if (low < 0.0) c = l + (c - l) * l / max(l - low, 0.00001);
  if (high > 1.0) c = l + (c - l) * (1.0 - l) / max(high - l, 0.00001);
  return c;
}
float softLight(float b, float s) {
  float d = b <= 0.25 ? ((16.0 * b - 12.0) * b + 4.0) * b : sqrt(b);
  return s <= 0.5 ? b - (1.0 - 2.0 * s) * b * (1.0 - b) : b + (2.0 * s - 1.0) * (d - b);
}`;

/** Canvas compositing uses straight colours in the blend function, then alpha.
 * Pixi's stock advanced blends operate on premultiplied samples, which changes
 * translucent grading. These three scene modes retain the Canvas definitions.
 */
function blendFilter(expression: string): Filter {
  return new Filter({
    glProgram: GlProgram.from({
      vertex: sceneFilterVertex,
      fragment: `
precision highp float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform sampler2D uBackTexture;
out vec4 finalColor;
${functions}
void main() {
  vec4 front = texture(uTexture, vTextureCoord), back = texture(uBackTexture, vTextureCoord);
  vec3 s = front.rgb / max(front.a, 0.00001), b = back.rgb / max(back.a, 0.00001);
  vec3 blended = ${expression};
  finalColor = vec4((1.0 - front.a) * back.rgb + (1.0 - back.a) * front.rgb + front.a * back.a * blended,
    front.a + back.a * (1.0 - front.a));
}`,
      name: 'issen-canvas-blend',
    }),
    // The output already includes the destination. Copy it exactly once.
    blendRequired: true,
    blendMode: 'none',
  });
}

// Extension factories must be constructible; returning the configured filter is
// supported by Pixi's blend-mode registry and keeps GLSL ownership in one place.
class CanvasColor {
  static extension = { name: 'color', type: ExtensionType.BlendMode };
  constructor() {
    return blendFilter('setLuminance(s, luminance(b))');
  }
}
class CanvasSoftLight {
  static extension = { name: 'soft-light', type: ExtensionType.BlendMode };
  constructor() {
    return blendFilter('vec3(softLight(b.r, s.r), softLight(b.g, s.g), softLight(b.b, s.b))');
  }
}
class CanvasOverlay {
  static extension = { name: 'overlay', type: ExtensionType.BlendMode };
  constructor() {
    return blendFilter('mix(2.0 * b * s, 1.0 - 2.0 * (1.0 - b) * (1.0 - s), step(vec3(0.5), b))');
  }
}
extensions.add(CanvasColor, CanvasSoftLight, CanvasOverlay);
