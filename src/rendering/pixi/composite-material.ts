import { lightingCompositeFunctions } from './lighting-composite-glsl.ts';
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
uniform vec4 uDiffuseRect;
uniform vec4 uMaskRect;
uniform vec4 uSurfaceRect;
uniform vec4 uEmissiveRect;
uniform vec4 uMaterial;
uniform vec4 uFog;
uniform float uHasMask;
uniform float uHasSurface;
uniform float uHasEmissive;
out vec4 finalColor;
${lightingCompositeFunctions}
void main() {
  vec4 colour = texture(uDiffuse, uDiffuseRect.xy + vUV * uDiffuseRect.zw);
  float alpha = colour.a * vColor.a;
  vec3 tint = vColor.rgb / max(vColor.a, 0.0001);
  vec3 original = clamp(colour.rgb / max(colour.a, 0.0001) * tint, 0.0, 1.0);
  vec3 albedo = toLinear(original);
  vec3 emissionColour = vec3(0.0);
  if (uHasSurface > 0.5 && uHasEmissive > 0.5) {
    vec4 emission = texture(uEmissive, uEmissiveRect.xy + vUV * uEmissiveRect.zw);
    emissionColour = toLinear(clamp(emission.rgb / max(emission.a, 0.0001) * tint, 0.0, 1.0));
  } else if (uHasSurface < 0.5 && uHasMask > 0.5) {
    emissionColour = albedo * texture(uMask, uMaskRect.xy + vUV * uMaskRect.zw).b;
  }
  float coverage = uHasSurface > 1.5 ? texture(uSurface, uSurfaceRect.xy + vUV * uSurfaceRect.zw).a : 1.0;
  vec3 lit = mix(original, sceneLightColour(original, vPosition, emissionColour), clamp(uMaterial.x * coverage, 0.0, 1.0));
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
      uNormal: Texture.WHITE.source,
      uMask: Texture.WHITE.source,
      uSurface: Texture.WHITE.source,
      uEmissive: Texture.EMPTY.source,
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
        shader.resources[name] = name === 'uEmissive' ? Texture.EMPTY.source : Texture.WHITE.source;
    },
    dispose() {
      shader.destroy();
    },
  };
}
