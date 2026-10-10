import {
  Buffer,
  BufferUsage,
  BufferImageSource,
  Color,
  Geometry,
  Mesh,
  Rectangle,
  Shader,
  Texture,
  UniformGroup,
} from 'pixi.js';
import type { Matrix } from 'pixi.js';
import type { GrassBlade } from '../scene/ambient.ts';
import type { LightTargets } from './light-buffer.ts';
import { lightingCompositeFunctions } from './lighting-composite-glsl.ts';
import { normalTransform } from '../scene-frame.ts';
import { createLightTargetBinding, setShaderResource } from './shader-resources.ts';
import { createLightShader } from './shared-light-resources.ts';
import type { BindGroup } from 'pixi.js';
import { ChangeTracker } from './change-tracker.ts';

const vertex = `#version 300 es
precision highp float;
in vec2 aPosition;
in vec2 aBase;
in vec3 aBlade;
in float aColourIndex;
in float aLayer;
in float aDensitySeed;
uniform mat3 uProjectionMatrix, uWorldTransformMatrix, uTransformMatrix;
uniform vec4 uWorldColorAlpha, uColor;
uniform sampler2D uPalette;
uniform int uPaletteWidth;
uniform vec3 uMotion;
uniform mat2 uNormalMatrix;
out vec2 vPosition;
out vec4 vColour;
out vec3 vNormal;
out float vLayer, vSelected, vCoverage;
void main() {
  float t = aPosition.y, q = 1.0-t;
  float h = aBlade.x, w = aBlade.y, phase = aBlade.z;
  float sway = uMotion.y*0.5 + sin(uMotion.x*2.3+phase)*0.25 + sin(uMotion.x*5.1+phase*2.0)*0.06;
  float tip = sway*h*0.45;
  float left = -w*q*q + 2.0*q*t*sway*h*0.1 + t*t*tip;
  float right = w*q*q + 2.0*q*t*(sway*h*0.12+w*0.3) + t*t*tip;
  vec2 position = aBase + vec2(mix(left,right,aPosition.x*0.5+0.5), -h*(q*t+t*t*(1.0-0.12*abs(sway))));
  vec3 world = uWorldTransformMatrix*uTransformMatrix*vec3(position,1.0);
  gl_Position = vec4((uProjectionMatrix*world).xy,0.0,1.0);
  vPosition = world.xy;
  int index = int(aColourIndex);
  vec4 colour = texelFetch(uPalette,ivec2(index%uPaletteWidth,index/uPaletteWidth),0);
  vec4 tint = uColor*uWorldColorAlpha;
  vColour = vec4(colour.rgb*tint.rgb/max(tint.a,0.0001),colour.a*tint.a);
  vec3 normal = vec3(-aPosition.x*0.65, t*0.3+sway*0.15,1.0);
  vNormal = normalize(vec3(uNormalMatrix*normal.xy,normal.z));
  vCoverage = colour.a;
  vLayer = aLayer;
  vSelected = step(aDensitySeed,uMotion.z);
}`;
const geometryFragment = `#version 300 es
precision highp float;
in vec4 vColour;
in vec3 vNormal;
in float vLayer, vSelected, vCoverage;
uniform vec3 uGeometry;
uniform float uLighting;
layout(location=0) out vec4 g0;
layout(location=1) out vec4 g1;
layout(location=2) out vec4 g2;
vec2 octEncode(vec3 n) { n /= abs(n.x)+abs(n.y)+abs(n.z); return n.xy*0.5+0.5; }
vec3 toLinear(vec3 c) { return mix(c/12.92,pow((c+0.055)/1.055,vec3(2.4)),step(vec3(0.04045),c)); }
void main() {
  if (vSelected<0.5) discard;
  // The uniform carries unquantized mesh/ancestor alpha; palette coverage is raw.
  float coverage = vCoverage * uGeometry.z;
  if (coverage < uGeometry.y) discard;
  float depth = floor(clamp(0.5+vLayer/(2.0*uGeometry.x),0.0,1.0)*255.0+0.5)/255.0;
  // Resolve UNORM midpoint ties explicitly, after testing the exact cutoff.
  float encodedCoverage=floor(clamp(coverage,0.0,1.0)*255.0+0.5)/255.0;
  g0=vec4(octEncode(normalize(vNormal)),depth,encodedCoverage);
  g1=vec4(0.85,0.0,1.0,uLighting>0.0 ? 1.0/255.0 : 0.0);
  g2=vec4(toLinear(vColour.rgb),clamp(uLighting,0.0,1.0));
}`;
const compositeFragment = `#version 300 es
precision highp float;
in vec2 vPosition;
in vec4 vColour;
in float vSelected;
uniform float uLighting;
uniform float uSinglePass;
uniform vec3 uAmbient;
${lightingCompositeFunctions}
out vec4 finalColor;
void main() {
  if (vSelected<0.5) discard;
  vec3 lit;
  if (uSinglePass>0.5) {
    vec2 uv=vPosition/uLightSize;
    vec3 diffuse,specular;
    sceneLightLookup(uv,diffuse,specular);
    // Grass borrows scenery lighting; uncovered sky uses the scene ambient.
    if(texture(uLightGuide,uv).a<0.001) diffuse=uAmbient;
    lit=toDisplay(highlightRolloff(toLinear(vColour.rgb)*diffuse));
  } else lit=sceneLightColour(vColour.rgb,vPosition,vec3(0.0));
  vec3 colour=mix(vColour.rgb,lit,clamp(uLighting,0.0,1.0));
  finalColor=vec4(colour*vColour.a,vColour.a);
}`;

/** One retained instanced strip for a depth layer; only uniforms change during motion. */
export function createGrassMesh(sharedLights?: BindGroup) {
  const data = new Buffer({
    data: new Float32Array(8),
    usage: BufferUsage.VERTEX | BufferUsage.COPY_DST,
  });
  const positions: number[] = [],
    indices: number[] = [];
  const segments = 12;
  for (let i = 0; i <= segments; i++) positions.push(-1, i / segments, 1, i / segments);
  for (let i = 0; i < segments; i++) {
    const n = i * 2;
    indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
  }
  const geometry = new Geometry({
    attributes: {
      aPosition: { buffer: new Float32Array(positions), format: 'float32x2' },
      aBase: { buffer: data, format: 'float32x2', stride: 32, offset: 0, instance: true },
      aBlade: { buffer: data, format: 'float32x3', stride: 32, offset: 8, instance: true },
      aColourIndex: { buffer: data, format: 'float32', stride: 32, offset: 20, instance: true },
      aLayer: { buffer: data, format: 'float32', stride: 32, offset: 24, instance: true },
      aDensitySeed: { buffer: data, format: 'float32', stride: 32, offset: 28, instance: true },
    },
    indexBuffer: new Uint32Array(indices),
    instanceCount: 0,
  });
  const uniforms = new UniformGroup({
    uPaletteWidth: { value: 1, type: 'i32' },
    uMotion: { value: new Float32Array([0, 0, 1]), type: 'vec3<f32>' },
    uNormalMatrix: { value: new Float32Array([1, 0, 0, 1]), type: 'mat2x2<f32>' },
    uLighting: { value: 1, type: 'f32' },
    uSinglePass: { value: 0, type: 'f32' },
    uAmbient: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
    uGeometry: { value: new Float32Array([1, 1, 1]), type: 'vec3<f32>' },
    uLightSize: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    uLightResolution: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
  });
  const composite = createLightShader(
    { vertex, fragment: compositeFragment, name: 'issen-instanced-grass-composite' },
    {
      grassUniforms: uniforms,
      uPalette: Texture.EMPTY.source,
    },
    sharedLights,
  );
  const shader = composite.shader;
  const gShader = Shader.from({
    gl: { vertex, fragment: geometryFragment, name: 'issen-instanced-grass-geometry' },
    resources: {
      grassUniforms: uniforms,
      uPalette: Texture.EMPTY.source,
    },
  });
  const mesh = new Mesh({ geometry, shader });
  let list: readonly GrassBlade[] | undefined,
    layer = 0,
    palette: Texture | undefined,
    disposed = false;
  const releasePalette = () => {
    setShaderResource(shader.resources, 'uPalette', Texture.EMPTY.source);
    setShaderResource(gShader.resources, 'uPalette', Texture.EMPTY.source);
    palette?.destroy(true);
    palette = undefined;
  };
  const lightBinding = createLightTargetBinding(shader.resources, Texture.EMPTY.source);
  const releaseLightTargets = lightBinding.detach;
  const geometryInputs = new ChangeTracker();
  let geometryRevision = 0;
  return {
    mesh,
    get geometryRevision() {
      return geometryRevision;
    },
    get geometryEnabled() {
      return uniforms.uniforms.uSinglePass === 0;
    },
    releaseLightTargets,
    update(
      blades: readonly GrassBlade[],
      time: number,
      wind: number,
      depth: number,
      density: number,
      lighting: number,
      transform: Matrix,
      ambient: readonly number[],
      singlePass: boolean,
    ) {
      if (list !== blades || layer !== depth) {
        list = blades;
        layer = depth;
        const colours = new Map<string, number>(),
          rgba: number[] = [],
          values = new Float32Array(Math.max(1, blades.length) * 8);
        let x0 = 0,
          y0 = 0,
          x1 = 0,
          y1 = 0;
        blades.forEach((b, i) => {
          let index = colours.get(b.col);
          if (index === undefined) {
            index = colours.size;
            colours.set(b.col, index);
            const c = new Color(b.col).toArray();
            rgba.push(...c);
          }
          values.set(
            [b.x, b.y, b.h, b.w, b.ph, index, depth, ((i + 1) * 0.61803398875) % 1],
            i * 8,
          );
          x0 = Math.min(x0, b.x - b.h - b.w);
          x1 = Math.max(x1, b.x + b.h + b.w);
          y0 = Math.min(y0, b.y - b.h);
          y1 = Math.max(y1, b.y);
        });
        data.data = values;
        data.update();
        geometry.instanceCount = blades.length;
        mesh.boundsArea = new Rectangle(x0, y0, x1 - x0, y1 - y0);
        releasePalette();
        const width = Math.min(1024, Math.max(1, colours.size)),
          height = Math.ceil(Math.max(1, colours.size) / width);
        const pixels = new Float32Array(width * height * 4);
        pixels.set(rgba);
        uniforms.uniforms.uPaletteWidth = width;
        palette = new Texture({
          source: new BufferImageSource({
            resource: pixels,
            width,
            height,
            format: 'rgba32float',
            alphaMode: 'no-premultiply-alpha',
            scaleMode: 'nearest',
          }),
        });
        shader.resources.uPalette = palette.source;
        gShader.resources.uPalette = palette.source;
      }
      uniforms.uniforms.uMotion.set([time, wind, Math.max(0, Math.min(1, density))]);
      uniforms.uniforms.uLighting = lighting;
      uniforms.uniforms.uSinglePass = singlePass ? 1 : 0;
      uniforms.uniforms.uAmbient.set(ambient);
      normalTransform(transform, uniforms.uniforms.uNormalMatrix, 1, 1);
      uniforms.update();
      geometryInputs.begin();
      geometryInputs.value(list);
      geometryInputs.value(layer);
      geometryInputs.numbers(uniforms.uniforms.uMotion);
      geometryInputs.numbers(uniforms.uniforms.uNormalMatrix);
      geometryInputs.value(lighting);
      if (geometryInputs.finish()) geometryRevision++;
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
      uniforms.uniforms.uLightSize.set([targets.sceneWidth, targets.sceneHeight]);
      uniforms.uniforms.uLightResolution.set([targets.width, targets.height]);
      uniforms.update();
      lightBinding.attach(targets);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseLightTargets();
      releasePalette();
      composite.dispose();
      gShader.destroy();
      mesh.destroy();
      geometry.destroy(true);
    },
  };
}
