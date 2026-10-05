type Frame = readonly [number, number, number, number];
export type UiTextureRenderer = (
  key: string,
  source: string,
  colour: HTMLCanvasElement,
  frame: Frame,
) => Promise<string | null>;
const renderers = new WeakMap<Document, UiTextureRenderer>();
export function registerUiTextureRenderer(doc: Document, renderer: UiTextureRenderer) {
  renderers.set(doc, renderer);
  return () => {
    if (renderers.get(doc) === renderer) renderers.delete(doc);
  };
}
export function renderUiMaterialTexture(
  doc: Document,
  key: string,
  source: string,
  colour: HTMLCanvasElement,
  frame: Frame,
) {
  return renderers.get(doc)?.(key, source, colour, frame) ?? Promise.resolve(null);
}
