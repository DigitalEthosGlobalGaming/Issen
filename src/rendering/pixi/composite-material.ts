import { lightingCompositeFunctions } from './lighting-composite-glsl.ts';
import { Texture, UniformGroup } from 'pixi.js';
import type { LightTargets } from './light-buffer.ts';
import { createLightTargetBinding, setShaderResource } from './shader-resources.ts';
import { createLightShader } from './shared-light-resources.ts';
import type { BindGroup, Shader } from 'pixi.js';

const textureNames = ['uDiffuse', 'uMask', 'uSurface', 'uEmissive'] as const;

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
export function createCompositeMaterial(
  vertex: string,
  materialUniforms: UniformGroup,
  sharedLights?: BindGroup,
) {
  const compositeUniforms = new UniformGroup({
    uLightSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    uLightResolution: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
  });
  const composite = createLightShader(
    { vertex: '#version 300 es\n' + vertex, fragment, name: 'issen-light-composite' },
    {
      materialUniforms,
      compositeUniforms,
      uDiffuse: Texture.WHITE.source,
      uNormal: Texture.WHITE.source,
      uMask: Texture.WHITE.source,
      uSurface: Texture.WHITE.source,
      uEmissive: Texture.EMPTY.source,
    },
    sharedLights,
  );
  const shader = composite.shader;
  const lightBinding = createLightTargetBinding(shader.resources, Texture.EMPTY.source);
  return {
    shader,
    update(source: Shader, targets: Readonly<LightTargets>) {
      for (const name of textureNames)
        setShaderResource(shader.resources, name, source.resources[name]);
      lightBinding.attach(targets);
      compositeUniforms.uniforms.uLightSize.set([targets.sceneWidth, targets.sceneHeight]);
      compositeUniforms.uniforms.uLightResolution.set([targets.width, targets.height]);
      compositeUniforms.update();
    },
    releaseLightTargets: lightBinding.detach,
    releaseTextures() {
      for (const name of textureNames)
        setShaderResource(
          shader.resources,
          name,
          name === 'uEmissive' ? Texture.EMPTY.source : Texture.WHITE.source,
        );
    },
    dispose() {
      composite.dispose();
    },
  };
}
