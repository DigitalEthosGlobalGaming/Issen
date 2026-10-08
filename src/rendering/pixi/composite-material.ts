import { Shader, Texture, UniformGroup } from 'pixi.js';
import type { LightTargets } from './light-buffer.ts';

const fragment = `#version 300 es
precision highp float;
in vec2 vUV;
in vec2 vPosition;
in vec4 vColor;
uniform sampler2D uDiffuse;
uniform sampler2D uMask;
uniform sampler2D uSurface;
uniform sampler2D uEmissive;
uniform sampler2D uLightDiffuse;
uniform sampler2D uLightSpecular;
uniform vec4 uDiffuseRect;
uniform vec4 uMaskRect;
uniform vec4 uSurfaceRect;
uniform vec4 uEmissiveRect;
uniform vec4 uMaterial;
uniform vec4 uFog;
uniform float uHasMask;
uniform float uHasSurface;
uniform float uHasEmissive;
uniform vec2 uLightSize;
out vec4 finalColor;
vec3 toLinear(vec3 colour) {
  return mix(colour / 12.92, pow((colour + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), colour));
}
vec3 toDisplay(vec3 colour) {
  return mix(colour * 12.92, 1.055 * pow(colour, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), colour));
}
vec3 highlightRolloff(vec3 colour) {
  colour = max(colour, vec3(0.0));
  float peak = max(colour.r, max(colour.g, colour.b));
  if (peak <= 0.8) return colour;
  float mapped = 0.8 + 0.2 * (1.0 - exp(-(peak - 0.8) / 0.2));
  return colour * (mapped / peak);
}
void main() {
  vec4 colour = texture(uDiffuse, uDiffuseRect.xy + vUV * uDiffuseRect.zw);
  float alpha = colour.a * vColor.a;
  vec3 tint = vColor.rgb / max(vColor.a, 0.0001);
  vec3 original = clamp(colour.rgb / max(colour.a, 0.0001) * tint, 0.0, 1.0);
  vec3 albedo = toLinear(original);
  vec2 screenUV = vPosition / uLightSize;
  vec3 result = albedo * texture(uLightDiffuse, screenUV).rgb + texture(uLightSpecular, screenUV).rgb;
  if (uHasSurface > 0.5 && uHasEmissive > 0.5) {
    vec4 emission = texture(uEmissive, uEmissiveRect.xy + vUV * uEmissiveRect.zw);
    result += toLinear(clamp(emission.rgb / max(emission.a, 0.0001) * tint, 0.0, 1.0));
  } else if (uHasSurface < 0.5 && uHasMask > 0.5) {
    result += albedo * texture(uMask, uMaskRect.xy + vUV * uMaskRect.zw).b;
  }
  float coverage = uHasSurface > 1.5 ? texture(uSurface, uSurfaceRect.xy + vUV * uSurfaceRect.zw).a : 1.0;
  vec3 lit = mix(original, toDisplay(highlightRolloff(result)), clamp(uMaterial.x * coverage, 0.0, 1.0));
  lit = mix(lit, uFog.rgb, clamp(uFog.a, 0.0, 1.0));
  finalColor = vec4(lit * alpha, alpha);
}`;

/** Ordered sprite composition only: BRDF evaluation belongs to the fullscreen light pass. */
export function createCompositeMaterial(vertex: string, materialUniforms: UniformGroup) {
  const compositeUniforms = new UniformGroup({
    uLightSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
  });
  const shader = Shader.from({
    gl: { vertex: '#version 300 es\n' + vertex, fragment, name: 'issen-light-composite' },
    resources: {
      materialUniforms,
      compositeUniforms,
      uDiffuse: Texture.WHITE.source,
      uMask: Texture.WHITE.source,
      uSurface: Texture.WHITE.source,
      uEmissive: Texture.WHITE.source,
      uLightDiffuse: Texture.EMPTY.source,
      uLightSpecular: Texture.EMPTY.source,
    },
  });
  return {
    shader,
    update(source: Shader, targets: Readonly<LightTargets>) {
      for (const name of ['uDiffuse', 'uMask', 'uSurface', 'uEmissive'])
        shader.resources[name] = source.resources[name];
      shader.resources.uLightDiffuse = targets.diffuse.source;
      shader.resources.uLightSpecular = targets.specular.source;
      compositeUniforms.uniforms.uLightSize.set([targets.width, targets.height]);
      compositeUniforms.update();
    },
    releaseLightTargets() {
      shader.resources.uLightDiffuse = shader.resources.uLightSpecular = Texture.EMPTY.source;
    },
    releaseTextures() {
      for (const name of ['uDiffuse', 'uMask', 'uSurface', 'uEmissive'])
        shader.resources[name] = Texture.WHITE.source;
    },
    dispose() {
      shader.destroy();
    },
  };
}
