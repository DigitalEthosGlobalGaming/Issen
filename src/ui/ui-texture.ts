/** Stable UI tokens never reference authoring image URLs. */
export const uiTextureSource = (stem: string, cell?: number) =>
  `issen-ui:${stem}${cell === undefined ? '' : `-${cell}`}`;
export const uiTexture = (stem: string, cell?: number) =>
  `var(--issen-ui-${stem}${cell === undefined ? '' : `-${cell}`})`;
