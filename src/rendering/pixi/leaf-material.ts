import {
  Buffer,
  BufferUsage,
  Geometry,
  Mesh,
  Rectangle,
  Shader,
  Texture,
  UniformGroup,
} from 'pixi.js';
import type { Matrix, TextureSource } from 'pixi.js';
import type { LeafFrame } from '../scene-leaves.ts';
import type { LightTargets } from './light-buffer.ts';
import type { SceneTextureStore } from './texture-store.ts';
import { DRIFT_BY_ID } from '../scene/drift-catalog.ts';
import { normalTransform } from '../scene-frame.ts';
import { lightingCompositeFunctions } from './lighting-composite-glsl.ts';
import { createLightTargetBinding, setShaderResource } from './shader-resources.ts';
import { createLightShader } from './shared-light-resources.ts';
import type { BindGroup } from 'pixi.js';

const compositeTextureNames = ['uDiffuse', 'uEmissive'] as const;
const geometryTextureNames = ['uDiffuse', 'uNormal', 'uSurface'] as const;

function samples(name: string) {
  return (
    Array.from({ length: 4 }, (_, i) => `uniform sampler2D ${name}${i};`).join('\n') +
    `\nvec4 sample${name}(int index,vec2 uv){` +
    Array.from({ length: 3 }, (_, i) => `if(index==${i})return texture(${name}${i},uv);`).join('') +
    `return texture(${name}3,uv);}\n`
  );
}
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
out vec4 vPose;
flat out int vAtlas;
out float vOpacity;
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
  vOpacity=aParams.z;
  vPose=vec4(c,s,flatten,aParams.w);
  vAtlas=int(aParams.y);
}`;
const geometryFragment = `#version 300 es
precision highp float;
in vec2 vUV;
in vec4 vColour,vPose;
flat in int vAtlas;
in float vOpacity;
uniform vec3 uGeometry;
uniform vec4 uAmounts;
uniform mat2 uNormalMatrix;
${samples('uDiffuse')}${samples('uNormal')}${samples('uSurface')}
layout(location=0)out vec4 g0;
layout(location=1)out vec4 g1;
layout(location=2)out vec4 g2;
vec3 toLinear(vec3 c){return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec2 octEncode(vec3 n){n/=abs(n.x)+abs(n.y)+abs(n.z);return n.xy*.5+.5;}
void main(){
  vec4 colour=sampleuDiffuse(vAtlas,vUV);
  float coverage=colour.a*vOpacity*uGeometry.z;if(coverage<uGeometry.y)discard;
  vec3 tint=vColour.rgb/max(vColour.a,.0001);
  vec3 albedo=toLinear(clamp(colour.rgb/max(colour.a,.0001)*tint,0.0,1.0));
  vec3 normal=sampleuNormal(vAtlas,vUV).rgb*2.0-1.0;normal.y*=vPose.w;
  float f=vPose.z,scale=sqrt(max(abs(f),.0001));
  vec2 xy=normal.xy*vec2(scale,scale/max(abs(f),.0001)*sign(f));
  xy=mat2(vPose.x,vPose.y,-vPose.y,vPose.x)*xy;
  // Paper's back face retains a view-facing Z while reversing its authored slopes.
  if(!gl_FrontFacing)xy=-xy;
  normal=normalize(vec3(uNormalMatrix*xy,max(abs(normal.z),.0001)));
  vec3 surface=clamp(sampleuSurface(vAtlas,vUV).rgb,0.0,1.0);
  float amount=clamp(uAmounts[vAtlas],0.0,1.0);
  g0=vec4(octEncode(normal),128.0/255.0,floor(clamp(coverage,0.0,1.0)*255.0+.5)/255.0);
  g1=vec4(surface,amount>0.0?1.0/255.0:0.0);
  g2=vec4(albedo,amount);
}`;
const compositeFragment = `#version 300 es
precision highp float;
in vec2 vUV,vPosition;
in vec4 vColour;
flat in int vAtlas;
in float vOpacity;
uniform vec4 uAmounts;
${samples('uDiffuse')}${samples('uEmissive')}
${lightingCompositeFunctions}
out vec4 finalColor;
void main(){
  vec4 colour=sampleuDiffuse(vAtlas,vUV);
  float alpha=colour.a*vColour.a;
  vec3 tint=vColour.rgb/max(vColour.a,.0001);
  vec3 original=clamp(colour.rgb/max(colour.a,.0001)*tint,0.0,1.0);
  vec4 emission=sampleuEmissive(vAtlas,vUV);
  vec3 emissive=toLinear(clamp(emission.rgb/max(emission.a,.0001)*tint,0.0,1.0));
  vec3 display=mix(original,sceneLightColour(original,vPosition,emissive),clamp(uAmounts[vAtlas],0.0,1.0));
  finalColor=vec4(display*alpha,alpha);
}`;
/** Four catalogue atlases share a single ordered instanced draw for each depth layer. */
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
    uGeometry: { value: new Float32Array([1, 0.5, 1]), type: 'vec3<f32>' },
    uNormalMatrix: { value: new Float32Array([1, 0, 0, 1]), type: 'mat2x2<f32>' },
    uLightSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    uLightResolution: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
  });
  const resources = (names: string[]) =>
    Object.fromEntries(
      names.flatMap((name) =>
        Array.from({ length: 4 }, (_, i) => [
          name + i,
          name === 'uEmissive' ? Texture.EMPTY.source : Texture.WHITE.source,
        ]),
      ),
    );
  const composite = createLightShader(
    { vertex, fragment: compositeFragment, name: 'issen-instanced-leaf-composite' },
    {
      leafUniforms: uniforms,
      ...resources(['uDiffuse', 'uEmissive']),
    },
    sharedLights,
  );
  const shader = composite.shader;
  const gShader = Shader.from({
    gl: { vertex, fragment: geometryFragment, name: 'issen-instanced-leaf-geometry' },
    resources: { leafUniforms: uniforms, ...resources(['uDiffuse', 'uNormal', 'uSurface']) },
  });
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
    for (let i = 0; i < 4; i++) {
      for (const name of compositeTextureNames)
        if (!source || shader.resources[name + i] === source)
          setShaderResource(
            shader.resources,
            name + i,
            (name === 'uEmissive' ? Texture.EMPTY : Texture.WHITE).source,
          );
      for (const name of geometryTextureNames)
        if (!source || gShader.resources[name + i] === source)
          setShaderResource(gShader.resources, name + i, Texture.WHITE.source);
    }
  };
  return {
    programs: [shader.glProgram, gShader.glProgram],
    mesh,
    releaseLightTargets,
    releaseTextures,
    update(frame: LeafFrame, textures: SceneTextureStore, lighting: number, transform: Matrix) {
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
            atlas.material.normalY ?? 1,
          );
        }
        data.data = new Float32Array(values.length ? values : new Array(26).fill(0));
        data.update();
        geometry.instanceCount = values.length / 26;
        revision = frame.motion.revision;
      }
      mesh.boundsArea = new Rectangle(-200, -200, frame.width + 400, frame.height + 400);
      uniforms.uniforms.uAmounts.fill(0);
      frame.atlases.forEach((atlas, i) => {
        if (!atlas.material.normal || !atlas.material.surface)
          throw new Error('Leaf atlas requires PBR normal and surface planes');
        const diffuse = textures.get(atlas.texture).source;
        setShaderResource(shader.resources, 'uDiffuse' + i, diffuse);
        setShaderResource(gShader.resources, 'uDiffuse' + i, diffuse);
        setShaderResource(
          gShader.resources,
          'uNormal' + i,
          textures.getData(atlas.material.normal).source,
        );
        setShaderResource(
          gShader.resources,
          'uSurface' + i,
          textures.getData(atlas.material.surface).source,
        );
        setShaderResource(
          shader.resources,
          'uEmissive' + i,
          atlas.material.emissive
            ? textures.get(atlas.material.emissive).source
            : Texture.EMPTY.source,
        );
        uniforms.uniforms.uAmounts[i] = atlas.material.lighting * lighting;
      });
      uniforms.uniforms.uLocalAlpha = mesh.alpha;
      const clock = frame.motion.clock;
      uniforms.uniforms.uMotion.set([clock.elapsed, clock.wind, clock.time, frame.scale]);
      normalTransform(transform, uniforms.uniforms.uNormalMatrix, 1, 1);
      uniforms.update();
    },
    beginGeometry(depthRange: number) {
      let alpha = mesh.alpha;
      for (let parent = mesh.parent; parent; parent = parent.parent) alpha *= parent.alpha;
      uniforms.uniforms.uGeometry.set([depthRange, 0.5, alpha]);
      uniforms.update();
      const blend = mesh.blendMode,
        stateBlend = mesh.state.blend;
      mesh.shader = gShader;
      mesh.blendMode = 'none';
      mesh.state.blend = false;
      return () => {
        mesh.shader = shader;
        mesh.blendMode = blend;
        mesh.state.blend = stateBlend;
      };
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
      gShader.destroy();
      mesh.destroy();
      geometry.destroy(true);
    },
  };
}
