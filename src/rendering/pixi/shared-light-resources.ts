import { BindGroup, Shader, Texture } from 'pixi.js';

const lightNames = ['uLightDiffuse', 'uLightSpecular', 'uLightGuide'] as const;
type Resource = Parameters<BindGroup['setResource']>[0];

/** Painter-owned resources: the number of listeners is independent of its mesh pool. */
export function createSharedLightResources(): BindGroup {
  return new BindGroup({
    0: Texture.EMPTY.source,
    1: Texture.EMPTY.source,
    2: Texture.EMPTY.source,
  });
}

/** Material uniforms remain owned here; the painter's light group is borrowed. */
export function createLightShader(
  gl: { vertex: string; fragment: string; name: string },
  resources: Record<string, Resource>,
  sharedLights?: BindGroup,
) {
  const lights = sharedLights ?? createSharedLightResources();
  const material = new BindGroup();
  const materialMap: Record<number, string> = {};
  let index = 0;
  for (const [name, resource] of Object.entries(resources)) {
    materialMap[index] = name;
    material.setResource(resource, index++);
  }
  const shader = Shader.from({
    gl,
    groups: { 3: lights, 99: material },
    groupMap: { 3: Object.fromEntries(lightNames.map((name, i) => [i, name])), 99: materialMap },
  });
  return {
    shader,
    dispose() {
      shader.destroy();
      material.destroy();
      if (!sharedLights) lights.destroy();
    },
  };
}
