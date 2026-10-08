import type { LightTargets } from './light-buffer.ts';

/** Avoid entering Pixi's resource update path for an unchanged binding. */
export function setShaderResource(
  resources: Record<string, unknown>,
  name: string,
  value: unknown,
): void {
  if (resources[name] !== value) resources[name] = value;
}

/** A material owns its attachment state; repeated release never touches Pixi. */
export function createLightTargetBinding(resources: Record<string, unknown>, empty: unknown) {
  let attached = false;
  return {
    attach(targets: Pick<LightTargets, 'diffuse' | 'specular' | 'guide'>) {
      setShaderResource(resources, 'uLightDiffuse', targets.diffuse.source);
      setShaderResource(resources, 'uLightSpecular', targets.specular.source);
      setShaderResource(resources, 'uLightGuide', targets.guide.source);
      attached = true;
    },
    detach() {
      if (!attached) return;
      attached = false;
      setShaderResource(resources, 'uLightDiffuse', empty);
      setShaderResource(resources, 'uLightSpecular', empty);
      setShaderResource(resources, 'uLightGuide', empty);
    },
  };
}
