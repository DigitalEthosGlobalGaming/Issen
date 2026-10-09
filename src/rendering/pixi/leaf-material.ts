import { Buffer, BufferUsage, Geometry, Mesh, Rectangle, Texture, UniformGroup } from 'pixi.js';
import type { TextureSource } from 'pixi.js';
import type { LeafFrame } from '../scene-leaves.ts';
import type { LightTargets } from './light-buffer.ts';
import type { SceneTextureStore } from './texture-store.ts';
import { DRIFT_BY_ID } from '../scene/drift-catalog.ts';
import { lightingCompositeFunctions } from './lighting-composite-glsl.ts';
import { createLightTargetBinding, setShaderResource } from './shader-resources.ts';
import { createLightShader } from './shared-light-resources.ts';
import type { BindGroup } from 'pixi.js';

const compositeTextureNames = ['uDiffuse', 'uEmissive'] as const;
const vertex = `#version 300 es
precision highp float;
in vec2 aPosition;
in vec4 aSpawn;
in vec3 aBirth;
in vec4 aFall;
in vec3 aFlutter;
in vec4 aShape;
in vec4 aFrame;
in vec4 aParams;
uniform mat3 uProjectionMatrix,uWorldTransformMatrix,uTransformMatrix;
uniform vec4 uWorldColorAlpha,uColor;
uniform vec4 uMotion;
uniform float uLocalAlpha;
out vec2 vUV,vPosition;
out vec4 vColour;
flat out float vFire;
flat out int vAtlas;

void main(){
  float age=max(0.0,uMotion.x-aBirth.x);
  vec2 origin=aSpawn.xy;
  origin.x+=(40.0*age+95.0*(uMotion.y-aBirth.y))*aSpawn.z*uMotion.w*aSpawn.w;
  origin.y+=(aFall.x*age+26.0/1.7*(cos(aBirth.z*1.7+aFall.y)-cos(uMotion.z*1.7+aFall.y)))*aSpawn.z*0.6*uMotion.w-aFall.z*age*uMotion.w;
  float angle=aParams.x+aFall.w*age;
  float flatten=1.0-aFlutter.z+aFlutter.z*cos(aFlutter.x+aFlutter.y*age);
  float c=cos(angle),s=sin(angle);
  vec2 local=(aPosition-aShape.zw)*aShape.xy;local.y*=flatten;
  vec3 world=uWorldTransformMatrix*uTransformMatrix*vec3(mat2(c,s,-s,c)*local+origin,1.0);
  gl_Position=vec4((uProjectionMatrix*world).xy,0.0,1.0);
  vPosition=world.xy;vUV=aFrame.xy+aPosition*aFrame.zw;
  float alpha=floor(clamp(uLocalAlpha*aParams.z,0.0,1.0)*255.0)/255.0;
  vColour=vec4(uColor.rgb/max(uColor.a,.0001)*alpha,alpha)*uWorldColorAlpha;
  vFire=aParams.w;
  vAtlas=int(aParams.y);
}`;
const compositeFragment = `#version 300 es
precision highp float;
in vec2 vUV,vPosition;
in vec4 vColour;
flat in int vAtlas;
flat in float vFire;
uniform vec4 uAmounts;
uniform sampler2D uDiffuse,uEmissive;
uniform vec3 uAmbient;
${lightingCompositeFunctions}
out vec4 finalColor;
void main(){
  vec4 colour=texture(uDiffuse,vUV);
  float alpha=colour.a*vColour.a;
  vec3 tint=vColour.rgb/max(vColour.a,.0001);
  vec3 original=clamp(colour.rgb/max(colour.a,.0001)*tint,0.0,1.0);
  vec4 emission=vFire>0.5?texture(uEmissive,vUV):vec4(0.0);
  vec3 emissive=toLinear(clamp(emission.rgb/max(emission.a,.0001)*tint,0.0,1.0));
  vec2 uv=vPosition/uLightSize;
  vec3 diffuse,specular;
  sceneLightLookup(uv,diffuse,specular);
  // No drift coverage in G0: sky uses scene ambient, never a fixed brightness.
  if(texture(uLightGuide,uv).a<0.001) diffuse=uAmbient;
  vec3 lit=toDisplay(highlightRolloff(toLinear(original)*diffuse+emissive));
  vec3 display=mix(original,lit,clamp(uAmounts[vAtlas],0.0,1.0));
  finalColor=vec4(display*alpha,alpha);
}`;
/** One merged atlas and one lit instanced draw per depth layer; no geometry writes. */
export function createLeafMesh(sharedLights?: BindGroup) {
  const data = new Buffer({
    data: new Float32Array(26),
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  });
  const attribute = (format: 'float32x3' | 'float32x4', offset: number) => ({
    buffer: data,
    format,
    stride: 104,
    offset: offset * 4,
    instance: true,
  });
  const geometry = new Geometry({
    attributes: {
      aPosition: { buffer: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), format: 'float32x2' },
      aSpawn: attribute('float32x4', 0),
      aBirth: attribute('float32x3', 4),
      aFall: attribute('float32x4', 7),
      aFlutter: attribute('float32x3', 11),
      aShape: attribute('float32x4', 14),
      aFrame: attribute('float32x4', 18),
      aParams: attribute('float32x4', 22),
    },
    indexBuffer: new Uint32Array([0, 1, 2, 0, 2, 3]),
    instanceCount: 0,
  });
  const uniforms = new UniformGroup({
    uLocalAlpha: { value: 1, type: 'f32' },
    uMotion: { value: new Float32Array(4), type: 'vec4<f32>' },
    uAmounts: { value: new Float32Array(4), type: 'vec4<f32>' },
    uAmbient: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
    uLightSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    uLightResolution: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
  });
  const composite = createLightShader(
    { vertex, fragment: compositeFragment, name: 'issen-instanced-leaf-composite' },
    {
      leafUniforms: uniforms,
      uDiffuse: Texture.WHITE.source,
      uEmissive: Texture.EMPTY.source,
    },
    sharedLights,
  );
  const shader = composite.shader;
  const mesh = new Mesh({ geometry, shader });
  let list: LeafFrame['leaves'] | undefined,
    revision = -1,
    atlases: LeafFrame['atlases'] | undefined,
    front = false,
    spriteMotion = false,
    disposed = false;
  const lightBinding = createLightTargetBinding(shader.resources, Texture.EMPTY.source);
  const releaseLightTargets = lightBinding.detach;
  const releaseTextures = (source?: TextureSource) => {
    for (const name of compositeTextureNames)
      if (!source || shader.resources[name] === source)
        setShaderResource(
          shader.resources,
          name,
          (name === 'uEmissive' ? Texture.EMPTY : Texture.WHITE).source,
        );
  };
  return {
    programs: [shader.glProgram],
    mesh,
    releaseLightTargets,
    releaseTextures,
    update(
      frame: LeafFrame,
      textures: SceneTextureStore,
      lighting: number,
      ambient: readonly [number, number, number] = [1, 1, 1],
    ) {
      if (atlases !== frame.atlases) releaseTextures();
      if (frame.atlases.length > 4) throw new Error('Leaf catalogue supports four atlas families');
      if (
        list !== frame.leaves ||
        revision !== frame.motion.revision ||
        atlases !== frame.atlases ||
        front !== frame.front ||
        spriteMotion !== frame.spriteMotion
      ) {
        list = frame.leaves;
        atlases = frame.atlases;
        front = frame.front;
        spriteMotion = frame.spriteMotion;
        const values: number[] = [];
        for (const leaf of frame.leaves) {
          if (leaf.z > 1.25 !== frame.front) continue;
          const sprite = DRIFT_BY_ID.get(leaf.sprite ?? 'leaves.willow');
          if (!sprite) throw new Error('Unknown leaf catalogue sprite');
          const index = frame.atlases.findIndex((atlas) => atlas.id === sprite.atlas),
            atlas = frame.atlases[index];
          if (!atlas) throw new Error('Missing leaf catalogue atlas');
          const [x, y, w, h] = sprite.frame,
            sx = Math.round(x * atlas.width),
            sy = Math.round(y * atlas.height),
            sw = Math.round((x + w) * atlas.width) - sx,
            sh = Math.round((y + h) * atlas.height) - sy;
          const width = leaf.s * 3 * sprite.size,
            height = (width * sh) / sw,
            birth = frame.motion.birth(leaf);
          values.push(
            leaf.x,
            leaf.y,
            leaf.z,
            leaf.gust ? 3.2 : 1,
            birth.elapsed,
            birth.wind,
            birth.time,
            leaf.vy,
            leaf.ph,
            frame.spriteMotion ? (leaf.rise ?? 0) : 0,
            leaf.vr * (frame.spriteMotion ? (leaf.spin ?? 1) : 1),
            leaf.fl,
            leaf.vf,
            frame.spriteMotion ? (leaf.flutter ?? 1) : 1,
            width,
            height,
            ...sprite.pivot,
            sx / atlas.width,
            sy / atlas.height,
            sw / atlas.width,
            sh / atlas.height,
            leaf.rot,
            index,
            (leaf.z > 1.25 ? 0.6 : 0.9) * sprite.opacity,
            sprite.atlas === 'fire' ? 1 : 0,
          );
        }
        data.data = new Float32Array(values.length ? values : new Array(26).fill(0));
        data.update();
        geometry.instanceCount = values.length / 26;
        revision = frame.motion.revision;
      }
      mesh.boundsArea = new Rectangle(-200, -200, frame.width + 400, frame.height + 400);
      uniforms.uniforms.uAmounts.fill(0);
      const atlas = frame.atlases[0];
      if (!atlas) throw new Error('Missing merged drift atlas');
      setShaderResource(shader.resources, 'uDiffuse', textures.get(atlas.texture).source);
      setShaderResource(
        shader.resources,
        'uEmissive',
        atlas.material.emissive
          ? textures.get(atlas.material.emissive).source
          : Texture.EMPTY.source,
      );
      frame.atlases.forEach((family, i) => {
        uniforms.uniforms.uAmounts[i] = family.material.lighting * lighting;
      });
      uniforms.uniforms.uAmbient.set(ambient);
      uniforms.uniforms.uLocalAlpha = mesh.alpha;
      const clock = frame.motion.clock;
      uniforms.uniforms.uMotion.set([clock.elapsed, clock.wind, clock.time, frame.scale]);
      uniforms.update();
    },
    prepareComposite(targets: Readonly<LightTargets>) {
      lightBinding.attach(targets);
      uniforms.uniforms.uLightSize.set([targets.sceneWidth, targets.sceneHeight]);
      uniforms.uniforms.uLightResolution.set([targets.width, targets.height]);
      uniforms.update();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseLightTargets();
      releaseTextures();
      composite.dispose();
      mesh.destroy();
      geometry.destroy(true);
    },
  };
}
