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
uniform vec4 uDiffuseRect;
uniform vec4 uNormalRect;
uniform vec4 uMaskRect;
uniform mat2 uNormalMatrix;
uniform vec3 uAmbient;
uniform vec3 uDirectional;
uniform vec3 uDirection;
uniform vec4 uPointPosition[4];
uniform vec4 uPointColor[4];
uniform vec4 uMaterial;
uniform vec4 uFog;
uniform float uHasMask;
out vec4 finalColor;

vec3 lightSurface(vec3 normal, vec3 direction, vec3 colour, vec3 mask) {
  float diffuse = max(dot(normal, direction), 0.0);
  vec3 halfway = normalize(direction + vec3(0.0, 0.0, 1.0));
  float specular = pow(max(dot(normal, halfway), 0.0), mix(8.0, 96.0, mask.g)) * mask.r;
  return colour * (diffuse + specular);
}

void main() {
  vec4 colour = texture(uDiffuse, uDiffuseRect.xy + vUV * uDiffuseRect.zw);
  vec3 normal = vec3(0.0, 0.0, 1.0);
  if (uMaterial.y > 0.5) {
    vec4 normalSample = texture(uNormal, uNormalRect.xy + vUV * uNormalRect.zw);
    vec3 decoded = normalSample.rgb / max(normalSample.a, 0.0001) * 2.0 - 1.0;
    normal = normalize(vec3(uNormalMatrix * decoded.xy, decoded.z));
  }
  vec3 mask = vec3(0.0);
  if (uHasMask > 0.5) {
    vec4 maskSample = texture(uMask, uMaskRect.xy + vUV * uMaskRect.zw);
    mask = maskSample.rgb / max(maskSample.a, 0.0001);
  }
  vec3 illumination = uAmbient + lightSurface(normal, normalize(uDirection), uDirectional, mask);
  for (int i = 0; i < 4; ++i) {
    vec3 offset = vec3(uPointPosition[i].xy - vPosition, uPointPosition[i].z + uMaterial.z);
    float distance = length(offset);
    float falloff = max(0.0, 1.0 - distance / max(uPointPosition[i].w, 0.001));
    illumination += lightSurface(normal, offset / max(distance, 0.001), uPointColor[i].rgb, mask)
      * falloff * falloff * uPointColor[i].a;
  }
  vec3 lit = colour.rgb * mix(vec3(1.0), illumination + vec3(mask.b), uMaterial.x);
  lit = mix(lit, uFog.rgb * colour.a, clamp(uFog.a, 0.0, 1.0));
  finalColor = vec4(lit, colour.a) * vColor;
}`;

function uvRect(texture: Texture): Float32Array {
  const frame = texture.frame;
  return new Float32Array([
    frame.x / texture.source.width,
    frame.y / texture.source.height,
    frame.width / texture.source.width,
    frame.height / texture.source.height,
  ]);
}

/** Forward lighting is opt-in per material; unlit artwork stays in Pixi's sprite batch. */
export function createMaterialMesh() {
  const uniforms = new UniformGroup({
    uDiffuseRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uNormalRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uMaskRect: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    uNormalMatrix: { value: new Float32Array([1, 0, 0, 1]), type: 'mat2x2<f32>' },
    uAmbient: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
    uDirectional: { value: new Float32Array(3), type: 'vec3<f32>' },
    uDirection: { value: new Float32Array([0, 0, 1]), type: 'vec3<f32>' },
    uPointPosition: { value: new Float32Array(16), type: 'vec4<f32>', size: 4 },
    uPointColor: { value: new Float32Array(16), type: 'vec4<f32>', size: 4 },
    uMaterial: { value: new Float32Array(4), type: 'vec4<f32>' },
    uFog: { value: new Float32Array(4), type: 'vec4<f32>' },
    uHasMask: { value: 0, type: 'f32' },
  });
  const shader = Shader.from({
    gl: { vertex, fragment, name: 'issen-sprite-material' },
    resources: {
      materialUniforms: uniforms,
      uDiffuse: Texture.WHITE.source,
      uNormal: Texture.WHITE.source,
      uMask: Texture.WHITE.source,
    },
  });
  const geometry = new MeshGeometry({
    positions: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
  });
  const mesh = new Mesh({ geometry, shader });
  const matrix = new Matrix();
  return {
    mesh,
    update(sprite: SceneSprite, lights: SceneLighting, textures: SceneTextureStore): void {
      const material = sprite.material!;
      const diffuse = textures.get(sprite.texture);
      const normal = material.normal ? textures.get(material.normal) : Texture.WHITE;
      const mask = material.mask ? textures.get(material.mask) : Texture.WHITE;
      shader.resources.uDiffuse = diffuse.source;
      shader.resources.uNormal = normal.source;
      shader.resources.uMask = mask.source;
      const u = uniforms.uniforms;
      u.uDiffuseRect.set(uvRect(diffuse));
      u.uNormalRect.set(uvRect(normal));
      u.uMaskRect.set(uvRect(mask));
      const transform = sprite.transform;
      const sx = sprite.width / diffuse.frame.width,
        sy = sprite.height / diffuse.frame.height;
      u.uNormalMatrix.set(
        normalTransform({
          ...transform,
          a: transform.a * sx,
          b: transform.b * sx,
          c: transform.c * sy,
          d: transform.d * sy,
        }),
      );
      u.uAmbient.set(lights.ambient);
      u.uDirectional.set(lights.directional);
      u.uDirection.set(lights.direction);
      u.uPointPosition.fill(0);
      u.uPointColor.fill(0);
      for (let i = 0; i < Math.min(4, lights.points.length); i++) {
        const light = lights.points[i]!;
        u.uPointPosition.set([light.x, light.y, light.z, light.radius], i * 4);
        u.uPointColor.set([...light.color, light.intensity], i * 4);
      }
      u.uMaterial.set([material.lighting, material.normal ? 1 : 0, material.depth, 0]);
      u.uFog.set([...material.fogColor, material.fog]);
      u.uHasMask = material.mask ? 1 : 0;
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
