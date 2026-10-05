import { Matrix, Mesh, MeshGeometry, Shader, Texture, UniformGroup } from 'pixi.js';
import { normalTransform } from '../scene-frame.ts';
import type { SceneLighting, SceneSprite } from '../scene-frame.ts';
import type { SceneTextureStore } from './texture-store.ts';

const vertex = `
precision highp float;
in vec2 aPosition;
in vec2 aUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
uniform vec4 uWorldColorAlpha;
uniform vec4 uColor;
out vec2 vUV;
out vec2 vPosition;
out vec4 vColor;
void main() {
  vec3 world = uWorldTransformMatrix * uTransformMatrix * vec3(aPosition, 1.0);
  gl_Position = vec4((uProjectionMatrix * world).xy, 0.0, 1.0);
  vUV = aUV;
  vPosition = world.xy;
  vColor = uColor * uWorldColorAlpha;
}`;

const fragment = `
precision highp float;
in vec2 vUV;
in vec2 vPosition;
in vec4 vColor;
uniform sampler2D uDiffuse;
uniform sampler2D uNormal;
uniform sampler2D uMask;
uniform sampler2D uSurface;
uniform sampler2D uEmissive;
uniform vec4 uDiffuseRect;
uniform vec4 uNormalRect;
uniform vec4 uMaskRect;
uniform vec4 uSurfaceRect;
uniform vec4 uEmissiveRect;
uniform mat2 uNormalMatrix;
uniform vec3 uAmbient;
uniform vec3 uDirectional;
uniform vec3 uDirection;
uniform vec4 uPointPosition[4];
uniform vec4 uPointColor[4];
uniform vec4 uMaterial;
uniform vec4 uFog;
uniform float uHasMask;
uniform float uHasSurface;
uniform float uHasEmissive;
out vec4 finalColor;

vec3 safeNormal(vec3 value) {
  return value * inversesqrt(max(dot(value, value), 0.000001));
}
vec3 toLinear(vec3 colour) {
  return mix(colour / 12.92, pow((colour + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), colour));
}
vec3 toDisplay(vec3 colour) {
  return mix(colour * 12.92, 1.055 * pow(colour, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), colour));
}
vec3 highlightRolloff(vec3 colour) {
  colour = max(colour, vec3(0.0));
  float peak = max(colour.r, max(colour.g, colour.b));
  // Preserve midtones and hue; compress only the range above the linear knee.
  if (peak <= 0.8) return colour;
  float mapped = 0.8 + 0.2 * (1.0 - exp(-(peak - 0.8) / 0.2));
  return colour * (mapped / peak);
}
vec3 lightSurface(vec3 normal, vec3 direction, vec3 light, vec3 albedo, vec3 mask) {
  float ndl = max(dot(normal, direction), 0.0);
  vec3 halfway = safeNormal(direction + vec3(0.0, 0.0, 1.0));
  float exponent = mix(8.0, 96.0, mask.g);
  float specular = pow(max(dot(normal, halfway), 0.0), exponent) * mask.r;
  return light * (albedo + vec3(specular)) * ndl;
}
vec3 lightPBR(vec3 normal, vec3 direction, vec3 light, vec3 albedo, vec3 surface) {
  float ndl = max(dot(normal, direction), 0.0);
  float ndv = max(normal.z, 0.0);
  if (ndl <= 0.0 || ndv <= 0.0) return vec3(0.0);
  float roughness = clamp(surface.r, 0.08, 1.0);
  float metallic = clamp(surface.g, 0.0, 1.0);
  vec3 halfway = safeNormal(direction + vec3(0.0, 0.0, 1.0));
  float ndh = max(dot(normal, halfway), 0.0);
  float vdh = max(halfway.z, 0.0);
  float a = roughness * roughness;
  float a2 = a * a;
  float denominator = ndh * ndh * (a2 - 1.0) + 1.0;
  float distribution = a2 / max(3.14159265 * denominator * denominator, 0.000001);
  float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
  float geometryL = ndl / (ndl * (1.0 - k) + k);
  float geometryV = ndv / (ndv * (1.0 - k) + k);
  vec3 f0 = mix(vec3(0.04), albedo, metallic);
  vec3 fresnel = f0 + (1.0 - f0) * pow(1.0 - vdh, 5.0);
  vec3 specular = distribution * geometryL * geometryV * fresnel / max(4.0 * ndl * ndv, 0.000001);
  vec3 diffuse = albedo * (1.0 - metallic) * (1.0 - fresnel) / 3.14159265;
  // Our light intensities use Lambert gain 1; scale the complete BRDF consistently.
  return light * (diffuse + specular) * ndl * 3.14159265;
}
void main() {
  vec4 colour = texture(uDiffuse, uDiffuseRect.xy + vUV * uDiffuseRect.zw);
  float alpha = colour.a * vColor.a;
  vec3 tint = vColor.rgb / max(vColor.a, 0.0001);
  vec3 original = clamp(colour.rgb / max(colour.a, 0.0001) * tint, 0.0, 1.0);
  vec3 albedo = toLinear(original);
  vec3 normal = vec3(0.0, 0.0, 1.0);
  if (uMaterial.y > 0.5) {
    // Data textures upload without alpha premultiplication or colour conversion.
    vec3 decoded = texture(uNormal, uNormalRect.xy + vUV * uNormalRect.zw).rgb * 2.0 - 1.0;
    decoded.y *= uMaterial.w;
    normal = safeNormal(vec3(uNormalMatrix * decoded.xy, decoded.z));
  }
  bool usePBR = uHasSurface > 0.5;
  vec3 mask = vec3(0.0);
  vec3 surface = vec3(1.0, 0.0, 1.0);
  if (usePBR) surface = clamp(texture(uSurface, uSurfaceRect.xy + vUV * uSurfaceRect.zw).rgb, 0.0, 1.0);
  else if (uHasMask > 0.5) mask = texture(uMask, uMaskRect.xy + vUV * uMaskRect.zw).rgb;
  vec3 result = albedo * uAmbient * (usePBR ? surface.b : 1.0);
  result += usePBR ? lightPBR(normal, uDirection, uDirectional, albedo, surface)
                   : lightSurface(normal, uDirection, uDirectional, albedo, mask);
  for (int i = 0; i < 4; ++i) {
    if (uPointColor[i].a <= 0.0) continue;
    vec3 offset = vec3(uPointPosition[i].xy - vPosition, uPointPosition[i].z + uMaterial.z);
    // Radius is the screen-plane footprint; height affects direction only.
    float falloff = max(0.0, 1.0 - length(offset.xy) / max(uPointPosition[i].w, 0.001));
    float strength = falloff * falloff * uPointColor[i].a;
    if (strength <= 0.0) continue;
    vec3 direction = safeNormal(offset);
    result += (usePBR ? lightPBR(normal, direction, uPointColor[i].rgb, albedo, surface)
                     : lightSurface(normal, direction, uPointColor[i].rgb, albedo, mask)) * strength;
  }
  if (usePBR && uHasEmissive > 0.5) {
    vec4 emission = texture(uEmissive, uEmissiveRect.xy + vUV * uEmissiveRect.zw);
    result += toLinear(clamp(emission.rgb / max(emission.a, 0.0001) * tint, 0.0, 1.0));
  } else if (!usePBR) result += albedo * mask.b;
  vec3 display = toDisplay(highlightRolloff(result));
  vec3 lit = mix(original, display, clamp(uMaterial.x, 0.0, 1.0));
  // Tint belongs to the surface, not the mist. Coverage remains premultiplied.
  lit = mix(lit, uFog.rgb, clamp(uFog.a, 0.0, 1.0));
  finalColor = vec4(lit * alpha, alpha);
}`;

function setUvRect(out: Float32Array, texture: Texture): void {
  if (texture.rotate || texture.trim)
    throw new Error('Material textures require unrotated, untrimmed frames.');
  const frame = texture.frame;
  out[0] = frame.x / texture.source.width;
  out[1] = frame.y / texture.source.height;
  out[2] = frame.width / texture.source.width;
  out[3] = frame.height / texture.source.height;
}
function linearChannel(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/** Forward lighting is opt-in per material; unlit artwork stays in Pixi's sprite batch. */
export function createMaterialMesh() {
  const uniforms = new UniformGroup({
    uDiffuseRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uNormalRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uMaskRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uSurfaceRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uEmissiveRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uNormalMatrix: { value: new Float32Array([1, 0, 0, 1]), type: 'mat2x2<f32>' },
    uAmbient: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
    uDirectional: { value: new Float32Array(3), type: 'vec3<f32>' },
    uDirection: { value: new Float32Array([0, 0, 1]), type: 'vec3<f32>' },
    uPointPosition: { value: new Float32Array(16), type: 'vec4<f32>', size: 4 },
    uPointColor: { value: new Float32Array(16), type: 'vec4<f32>', size: 4 },
    uMaterial: { value: new Float32Array(4), type: 'vec4<f32>' },
    uFog: { value: new Float32Array(4), type: 'vec4<f32>' },
    uHasMask: { value: 0, type: 'f32' },
    uHasSurface: { value: 0, type: 'f32' },
    uHasEmissive: { value: 0, type: 'f32' },
  });
  const shader = Shader.from({
    gl: { vertex, fragment, name: 'issen-sprite-material' },
    resources: {
      materialUniforms: uniforms,
      uDiffuse: Texture.WHITE.source,
      uNormal: Texture.WHITE.source,
      uMask: Texture.WHITE.source,
      uSurface: Texture.WHITE.source,
      uEmissive: Texture.WHITE.source,
    },
  });
  const geometry = new MeshGeometry({
    positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
  const mesh = new Mesh({ geometry, shader });
  const matrix = new Matrix();
  const selected: (SceneLighting['points'][number] | undefined)[] = new Array(4);
  const scores = new Float64Array(4);
  return {
    mesh,
    update(sprite: SceneSprite, lights: SceneLighting, textures: SceneTextureStore): void {
      const material = sprite.material!;
      const diffuse = textures.get(sprite.texture);
      const normal = material.normal ? textures.getData(material.normal) : Texture.WHITE;
      const mask = material.mask ? textures.getData(material.mask) : Texture.WHITE;
      const surface = material.surface ? textures.getData(material.surface) : Texture.WHITE;
      const emissive = material.emissive ? textures.get(material.emissive) : Texture.WHITE;
      shader.resources.uDiffuse = diffuse.source;
      shader.resources.uNormal = normal.source;
      shader.resources.uMask = mask.source;
      shader.resources.uSurface = surface.source;
      shader.resources.uEmissive = emissive.source;
      const u = uniforms.uniforms;
      setUvRect(u.uDiffuseRect, diffuse);
      setUvRect(u.uNormalRect, normal);
      setUvRect(u.uMaskRect, mask);
      setUvRect(u.uSurfaceRect, surface);
      setUvRect(u.uEmissiveRect, emissive);
      const transform = sprite.transform;
      normalTransform(
        transform,
        u.uNormalMatrix,
        sprite.width / diffuse.frame.width,
        sprite.height / diffuse.frame.height,
      );
      u.uAmbient.set(lights.ambient);
      u.uDirectional.set(lights.directional);
      const directionLength = Math.hypot(...lights.direction);
      for (let j = 0; j < 3; j++)
        u.uDirection[j] =
          directionLength > 0.000001 ? lights.direction[j]! / directionLength : j === 2 ? 1 : 0;
      u.uPointPosition.fill(0);
      u.uPointColor.fill(0);
      // Keep the four strongest lights whose 2D footprints reach this sprite.
      selected.fill(undefined);
      scores.fill(-1);
      const ax = transform.a * sprite.width,
        bx = transform.c * sprite.height;
      const ay = transform.b * sprite.width,
        by = transform.d * sprite.height;
      const minX = transform.tx + Math.min(0, ax) + Math.min(0, bx);
      const maxX = transform.tx + Math.max(0, ax) + Math.max(0, bx);
      const minY = transform.ty + Math.min(0, ay) + Math.min(0, by);
      const maxY = transform.ty + Math.max(0, ay) + Math.max(0, by);
      for (const light of lights.points) {
        if (light.radius <= 0 || light.intensity <= 0) continue;
        const distance = Math.hypot(
          Math.max(minX - light.x, 0, light.x - maxX),
          Math.max(minY - light.y, 0, light.y - maxY),
        );
        const falloff = Math.max(0, 1 - distance / light.radius);
        const score = falloff * falloff * light.intensity * Math.max(...light.color);
        if (score <= 0) continue;
        for (let i = 0; i < 4; i++) {
          if (score <= scores[i]!) continue;
          for (let j = 3; j > i; j--) {
            scores[j] = scores[j - 1]!;
            selected[j] = selected[j - 1];
          }
          scores[i] = score;
          selected[i] = light;
          break;
        }
      }
      for (let i = 0; i < 4; i++) {
        const light = selected[i];
        if (!light) continue;
        const offset = i * 4;
        u.uPointPosition[offset] = light.x;
        u.uPointPosition[offset + 1] = light.y;
        u.uPointPosition[offset + 2] = light.z;
        u.uPointPosition[offset + 3] = light.radius;
        for (let j = 0; j < 3; j++) u.uPointColor[offset + j] = linearChannel(light.color[j]!);
        u.uPointColor[offset + 3] = light.intensity;
      }
      u.uMaterial[0] = material.lighting * (lights.materialLighting ?? 1);
      u.uMaterial[1] = material.normal ? 1 : 0;
      u.uMaterial[2] = material.depth;
      u.uMaterial[3] = material.normalY ?? 1;
      for (let j = 0; j < 3; j++) u.uFog[j] = material.fogColor[j]!;
      u.uFog[3] = material.fog;
      u.uHasMask = material.mask ? 1 : 0;
      u.uHasSurface = material.surface ? 1 : 0;
      u.uHasEmissive = material.emissive ? 1 : 0;
      uniforms.update();
      const t = sprite.transform;
      matrix.set(
        t.a * sprite.width,
        t.b * sprite.width,
        t.c * sprite.height,
        t.d * sprite.height,
        t.tx,
        t.ty,
      );
      mesh.setFromMatrix(matrix);
      mesh.alpha = sprite.alpha;
      mesh.tint = sprite.tint;
      mesh.blendMode = sprite.blend;
    },
    dispose(): void {
      mesh.destroy();
      geometry.destroy();
      shader.destroy();
    },
  };
}
