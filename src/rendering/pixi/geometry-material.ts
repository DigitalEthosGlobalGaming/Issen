import { Shader, Texture, UniformGroup } from 'pixi.js';
import type { TextureSource } from 'pixi.js';
import { setShaderResource } from './shader-resources.ts';

const textureNames = ['uDiffuse', 'uNormal', 'uMask', 'uSurface'] as const;

const fragment = `#version 300 es
precision highp float;
in vec2 vUV;
in vec4 vColor;
uniform sampler2D uDiffuse;
uniform sampler2D uNormal;
uniform sampler2D uMask;
uniform sampler2D uSurface;
uniform vec4 uDiffuseRect;
uniform vec4 uNormalRect;
uniform vec4 uMaskRect;
uniform vec4 uSurfaceRect;
uniform mat2 uNormalMatrix;
uniform vec4 uMaterial;
uniform float uHasMask;
uniform float uHasSurface;
uniform vec3 uGeometry;
layout(location = 0) out vec4 g0;
layout(location = 1) out vec4 g1;
layout(location = 2) out vec4 g2;
vec3 safeNormal(vec3 n) { return n * inversesqrt(max(dot(n,n),0.000001)); }
vec3 toLinear(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055,vec3(2.4)),step(vec3(0.04045),c)); }
vec2 octEncode(vec3 n) {
  n /= abs(n.x) + abs(n.y) + abs(n.z);
  vec2 xy = n.xy;
  if (n.z < 0.0) xy = (1.0 - abs(xy.yx)) * mix(vec2(-1.0),vec2(1.0),step(vec2(0.0),xy));
  return xy * 0.5 + 0.5;
}
void main() {
  highp vec4 colour = texture(uDiffuse,uDiffuseRect.xy + vUV * uDiffuseRect.zw);
  // Pixi packs colour alpha to a byte; cutoff uses the original effective alpha.
  float coverage = colour.a * uGeometry.z;
  if (coverage < uGeometry.y) discard;
  mediump vec3 tint = vColor.rgb / max(vColor.a,0.0001);
  mediump vec3 albedo = toLinear(clamp(colour.rgb / max(colour.a,0.0001) * tint,0.0,1.0));
  vec3 normal = vec3(0.0,0.0,1.0);
  if (uMaterial.y > 0.5) {
    vec3 decoded = texture(uNormal,uNormalRect.xy + vUV * uNormalRect.zw).rgb * 2.0 - 1.0;
    decoded.y *= uMaterial.w;
    normal = safeNormal(vec3(uNormalMatrix * decoded.xy,decoded.z));
  }
  vec4 surface = uHasSurface > 0.5 ? texture(uSurface,uSurfaceRect.xy + vUV * uSurfaceRect.zw) : vec4(1.0,0.0,1.0,1.0);
  float flag = uMaterial.x > 0.0 ? 1.0 : 0.0;
  if (uHasSurface < 0.5 && uHasMask > 0.5) {
    vec3 mask = texture(uMask,uMaskRect.xy + vUV * uMaskRect.zw).rgb;
    // Convert legacy gloss to GGX roughness and specular strength to metallic response.
    // Emission remains an own-albedo term in the ordered composite; AO defaults to 1.
    surface.rgb = vec3(sqrt(sqrt(2.0 / (mix(8.0,96.0,mask.g) + 2.0))),mask.r,1.0);
  }
  float amount = clamp(uMaterial.x * (uHasSurface > 1.5 ? surface.a : 1.0),0.0,1.0);
  if (amount <= 0.0) flag = 0.0;
  float depth = clamp(0.5 + uMaterial.z / (2.0 * uGeometry.x),0.0,1.0);
  // Define the half-step tie explicitly; UNORM conversion otherwise permits either neighbour.
  depth = floor(depth * 255.0 + 0.5) / 255.0;
  g0 = vec4(octEncode(normal),depth,coverage);
  g1 = vec4(clamp(surface.rgb,0.0,1.0),flag / 255.0);
  g2 = vec4(albedo,amount);
}`;

/** Shares already-updated material maps/UVs and normal transforms with its mesh. */
export function createGeometryMaterial(vertex: string, materialUniforms: UniformGroup) {
  const geometryUniforms = new UniformGroup({
    uGeometry: { value: new Float32Array([1, 0.5, 1]), type: 'vec3<f32>' },
  });
  const shader = Shader.from({
    gl: { vertex: '#version 300 es\n' + vertex, fragment, name: 'issen-geometry-material' },
    resources: {
      materialUniforms,
      geometryUniforms,
      uDiffuse: Texture.WHITE.source,
      uNormal: Texture.WHITE.source,
      uMask: Texture.WHITE.source,
      uSurface: Texture.WHITE.source,
    },
  });
  return {
    shader,
    update(source: Shader, depthRange: number, cutoff: number, alpha: number) {
      for (const name of textureNames)
        setShaderResource(shader.resources, name, source.resources[name]);
      const geometry = geometryUniforms.uniforms.uGeometry;
      geometry[0] = depthRange;
      geometry[1] = cutoff;
      geometry[2] = alpha;
      geometryUniforms.update();
    },
    releaseTextures(source?: TextureSource) {
      for (const name of textureNames)
        if (!source || shader.resources[name] === source)
          setShaderResource(shader.resources, name, Texture.WHITE.source);
    },
    dispose() {
      shader.destroy();
    },
  };
}
