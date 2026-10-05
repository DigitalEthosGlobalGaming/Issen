/** Public PBR Forge Engine Settings, not its preview-only controls. */
export const SETTINGS = {
  normalIntensity: { tab: 'Normal', id: 'param-strength', min: 0.1, max: 10, step: 0.1 },
  bevelWidth: { tab: 'Normal', id: 'param-bevel', min: 0, max: 50, step: 1, spriteOnly: true },
  bevelHeight: {
    tab: 'Normal',
    id: 'param-bevel-strength',
    min: 0.1,
    max: 3,
    step: 0.1,
    spriteOnly: true,
  },
  detail: { tab: 'Normal', id: 'param-detail', min: 0, max: 1, step: 0.1, spriteOnly: true },
  smoothing: { tab: 'Normal', id: 'param-smooth', min: 0, max: 10, step: 0.5 },
  roughnessBase: { tab: 'Roughness', id: 'param-roughness-base', min: 0, max: 1, step: 0.05 },
  roughnessVariation: {
    tab: 'Roughness',
    id: 'param-roughness-strength',
    min: 0.1,
    max: 5,
    step: 0.1,
  },
  roughnessBlur: { tab: 'Roughness', id: 'param-roughness-radius', min: 0, max: 10, step: 0.5 },
  metallicOffset: { tab: 'Metallic', id: 'param-metallic-base', min: -0.5, max: 0.5, step: 0.05 },
  metallicContrast: { tab: 'Metallic', id: 'param-metallic-contrast', min: 0, max: 3, step: 0.1 },
  emissiveIntensity: { tab: 'Emissive', id: 'param-emissive-strength', min: 0, max: 5, step: 0.1 },
};
