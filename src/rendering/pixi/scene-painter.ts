import { preferredLightResolution } from '../effects/quality.ts';
import { GeometryBuffer, requireGeometryBuffers } from './geometry-buffer.ts';
import type { GeometryDebugView } from './geometry-buffer.ts';
import { LightBuffer, requireLightBuffers } from './light-buffer.ts';
import { GraphicsUnsupportedError, reportGraphicsError } from '../graphics-error.ts';
import {
  Color,
  Container,
  FillGradient,
  FillPattern,
  Graphics,
  GraphicsContext,
  GraphicsPath,
  Matrix,
  WebGLRenderer,
  Rectangle,
  BindGroup,
  BlurFilter,
  ColorMatrixFilter,
  Texture,
  MeshSimple,
} from 'pixi.js';
import type { FillStyle, GradientOptions, BLEND_MODES } from 'pixi.js';
import './canvas-blends.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import { registerScenePathSink, registerSceneFilmPass } from '../scene-drawing.ts';
import { createCopyFilmPass } from './film-pass.ts';
import { SceneTextureStore } from './texture-store.ts';
import { sceneTextureRevision } from '../texture-revision.ts';
import { registerMaterialSink } from '../scene-material.ts';
import type { SceneLighting } from '../scene-frame.ts';
import { createMaterialMesh } from './material.ts';
import { ArtworkMaterials } from './artwork-materials.ts';
import { createGrassMesh } from './grass-material.ts';
import { createLeafMesh } from './leaf-material.ts';
import { registerLeafSink } from '../scene-leaves.ts';
import { registerGrassSink } from '../scene-grass.ts';
import { createRoundStroke, createRoundStrokeTexture, updateRoundStroke } from './round-stroke.ts';
import { registerBrushRingSink, registerGlyphArrowSink } from '../scene-brush-ring.ts';

function sceneColor(value: string): Color {
  // JavaScript emits scientific notation near zero. Browser Canvas accepts it,
  // but Pixi's CSS parser rejects it; pass those numeric RGBA components directly.
  if (/[eE][+-]?\d/.test(value)) {
    const match = /^rgba?\(([^)]+)\)$/.exec(value);
    const parts = match?.[1]?.split(',').map(Number);
    if (parts && (parts.length === 3 || parts.length === 4) && parts.every(Number.isFinite))
      return new Color([parts[0]! / 255, parts[1]! / 255, parts[2]! / 255, parts[3] ?? 1]);
  }
  return new Color(value);
}

class Gradient implements CanvasGradient {
  readonly stops: { offset: number; color: string }[] = [];
  constructor(
    readonly options: GradientOptions,
    readonly matrix: Matrix,
  ) {}
  addColorStop(offset: number, color: string): void {
    this.stops.push({
      offset,
      color: /[eE][+-]?\d/.test(color) ? sceneColor(color).toHexa() : color,
    });
  }
}
class Pattern implements CanvasPattern {
  readonly matrix = new Matrix();
  constructor(
    readonly image: HTMLCanvasElement | HTMLImageElement,
    readonly repeat: string,
  ) {}
  setTransform(t: DOMMatrix2DInit = {}): void {
    this.matrix.set(t.a ?? 1, t.b ?? 0, t.c ?? 0, t.d ?? 1, t.e ?? 0, t.f ?? 0);
  }
}
const styleKeys = [
  'globalAlpha',
  'globalCompositeOperation',
  'fillStyle',
  'strokeStyle',
  'lineWidth',
  'lineCap',
  'lineJoin',
  'font',
  'textAlign',
  'textBaseline',
  'filter',
  'shadowBlur',
  'shadowColor',
  'shadowOffsetX',
  'shadowOffsetY',
  'imageSmoothingEnabled',
  'imageSmoothingQuality',
] as const;
type DrawStyle = Pick<SceneDrawing, (typeof styleKeys)[number]>;
type MaterialMesh = ReturnType<typeof createMaterialMesh>['mesh'];
type Slot = {
  item:
    | Graphics
    | MaterialMesh
    | MeshSimple
    | ReturnType<typeof createGrassMesh>['mesh']
    | ReturnType<typeof createLeafMesh>['mesh'];
  kind:
    | 'graphics'
    | 'sprite'
    | 'material'
    | 'round-stroke'
    | 'brush-ring'
    | 'ellipse'
    | 'glyph-arrow'
    | 'grass'
    | 'leaf';
  material?: ReturnType<typeof createMaterialMesh>;
  lookup?: ReturnType<ArtworkMaterials['createMesh']>;
  grass?: ReturnType<typeof createGrassMesh>;
  leaf?: ReturnType<typeof createLeafMesh>;
  filterKey?: string;
  filters?: (BlurFilter | ColorMatrixFilter)[];
  image?: HTMLImageElement | HTMLCanvasElement;
  revision?: number;
  sx?: number;
  sy?: number;
  sw?: number;
  sh?: number;
  transformA?: number;
  transformB?: number;
  transformC?: number;
  transformD?: number;
  transformX?: number;
  transformY?: number;
};

/**
 * Native Pixi scene drawing. Poses emit sprites, tessellated paths and cached text;
 * no live scene is drawn into or uploaded from a full-screen Canvas texture.
 */
export class PixiScenePainter implements SceneDrawing {
  globalAlpha = 1;
  globalCompositeOperation: GlobalCompositeOperation = 'source-over';
  fillStyle: string | CanvasGradient | CanvasPattern = '#000000';
  strokeStyle: string | CanvasGradient | CanvasPattern = '#000000';
  lineWidth = 1;
  lineCap: CanvasLineCap = 'butt';
  lineJoin: CanvasLineJoin = 'miter';
  font = '10px sans-serif';
  textAlign: CanvasTextAlign = 'start';
  textBaseline: CanvasTextBaseline = 'alphabetic';
  filter = 'none';
  shadowBlur = 0;
  shadowColor = 'rgba(0,0,0,0)';
  shadowOffsetX = 0;
  shadowOffsetY = 0;
  imageSmoothingEnabled = true;
  imageSmoothingQuality: ImageSmoothingQuality = 'low';
  readonly root = new Container();
  private readonly textures = new SceneTextureStore();
  private roundStrokeTexture?: Texture;
  private readonly brushRings = new Map<string, GraphicsContext>();
  private readonly glyphArrows = new Map<string, GraphicsContext>();
  private readonly slots: Slot[] = [];
  private readonly gradients = new Map<string, FillGradient>();
  private readonly patterns = new Map<Pattern, FillPattern>();
  private readonly stack: { style: DrawStyle; matrix: Matrix; clipDepth: number }[] = [];
  private stackDepth = 0;
  private readonly matrix = new Matrix();
  private readonly scratch = new Matrix();
  private readonly colours = new Map<string, Color>();
  private retainTree = false;
  private path = new GraphicsPath();
  private pendingEllipse = false;
  private readonly ellipseTransform = new Matrix();
  private ellipseStart = 0;
  private ellipseEnd = 0;
  private ellipseCcw = false;
  private cursor = 0;
  private disposed = false;
  contextLost = false;
  private readonly loseContext = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.canvas.dataset.contextState = 'lost';
  };
  private readonly restoreContext = () => {
    try {
      requireGeometryBuffers(this.renderer.gl as WebGL2RenderingContext);
      requireLightBuffers(this.renderer.gl as WebGL2RenderingContext);
      this.artworkMaterials.restore();
      this.artworkMaterials.detachTargets();
      for (const slot of this.slots) {
        slot.material?.releaseLightTargets();
        slot.grass?.releaseLightTargets();
        slot.leaf?.releaseLightTargets();
      }
      this.lightBuffer.detachGeometry();
      this.geometryBuffer.resize(this.canvas.width, this.canvas.height, true);
      this.lightBuffer.resize(this.canvas.width, this.canvas.height, true);
      this.contextLost = false;
      this.canvas.dataset.contextState = 'ready';
    } catch {
      reportGraphicsError(this.canvas);
    }
  };
  private readonly clips: Graphics[] = [];
  private readonly transientGroups: Container[] = [];
  private readonly textCache = new Map<
    string,
    { canvas: HTMLCanvasElement; left: number; top: number }
  >();
  private readonly measure: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private readonly usedGradients = new Set<string>();
  private readonly usedPatterns = new Set<Pattern>();
  private copyFilm?: ReturnType<typeof createCopyFilmPass>;
  private lighting: SceneLighting = {
    ambient: [0.86, 0.86, 0.86],
    directional: [0.2, 0.2, 0.2],
    direction: [-0.4, -0.5, 1],
    points: [],
  };

  private readonly geometryBuffer: GeometryBuffer;
  private readonly lightBuffer: LightBuffer;
  private readonly artworkMaterials: ArtworkMaterials;
  get lightTargets() {
    return this.lightBuffer.targets;
  }
  get geometryTargets() {
    return this.geometryBuffer.targets;
  }

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly renderer: WebGLRenderer<HTMLCanvasElement>,
  ) {
    this.geometryBuffer = new GeometryBuffer(renderer);
    this.geometryBuffer.resize(canvas.width, canvas.height);
    this.artworkMaterials = new ArtworkMaterials(renderer);
    this.lightBuffer = new LightBuffer(renderer);
    this.lightBuffer.resize(canvas.width, canvas.height);
    canvas.addEventListener('webglcontextlost', this.loseContext);
    canvas.addEventListener('webglcontextrestored', this.restoreContext);
    canvas.dataset.contextState = 'ready';
    this.measure = canvas.ownerDocument.createElement('canvas').getContext('2d')!;
    registerLeafSink(this, (frame) => {
      const item = this.submit('leaf');
      const slot = this.slots[this.cursor - 1]!;
      this.applyTransform(item, this.matrix);
      slot.leaf!.update(frame, this.textures, this.lighting.materialLighting ?? 1, this.matrix);
    });
    registerGrassSink(this, (frame) => {
      const item = this.submit('grass');
      const slot = this.slots[this.cursor - 1]!;
      this.applyTransform(item, this.matrix);
      slot.grass!.update(
        frame.blades,
        frame.time,
        frame.wind,
        frame.depth,
        frame.density,
        this.lighting.materialLighting ?? 1,
        this.matrix,
      );
    });
    registerGlyphArrowSink(this, (radius, ghost) => {
      const { a, b, c, d } = this.matrix;
      const scaleSquared = a * a + b * b;
      if (
        typeof this.strokeStyle !== 'string' ||
        this.lineCap !== 'round' ||
        this.lineWidth !== radius * (ghost ? 0.12 : 0.23) ||
        this.shadowBlur !== 0 ||
        this.shadowOffsetX !== 0 ||
        this.shadowOffsetY !== 0 ||
        scaleSquared === 0 ||
        Math.abs(scaleSquared - c * c - d * d) > scaleSquared * 1e-6 ||
        Math.abs(a * c + b * d) > scaleSquared * 1e-6
      )
        return false;
      const key = `${ghost}:${this.lineJoin}`;
      let context = this.glyphArrows.get(key);
      if (!context) {
        context = new GraphicsContext();
        const x = ghost ? 0.12 : 0.02,
          y = ghost ? 0.28 : 0.36;
        context
          .moveTo(32 * x, -32 * y)
          .lineTo(32 * (ghost ? 0.46 : 0.44), 0)
          .lineTo(32 * x, 32 * y)
          .stroke({
            color: 0xffffff,
            width: 32 * (ghost ? 0.12 : 0.23),
            cap: 'round',
            join: this.lineJoin,
          });
        this.glyphArrows.set(key, context);
      }
      const item = this.submit('glyph-arrow');
      const colour = this.colour(this.strokeStyle);
      item.context = context;
      item.tint = colour.toNumber();
      item.alpha *= colour.alpha;
      this.applyTransform(item, this.composed(radius / 32, 0, 0, radius / 32, 0, 0));
      return true;
    });
    registerBrushRingSink(this, (radius, colour) => {
      // Canvas-shaped strokes use determinant-scaled width. Retained local
      // geometry matches that for rotations/reflections and uniform scale only.
      const { a, b, c, d } = this.matrix;
      const scaleSquared = a * a + b * b;
      if (
        scaleSquared === 0 ||
        Math.abs(scaleSquared - c * c - d * d) > scaleSquared * 1e-6 ||
        Math.abs(a * c + b * d) > scaleSquared * 1e-6
      )
        return false;
      let context = this.brushRings.get(colour);
      if (!context) {
        context = new GraphicsContext();
        const paint = sceneColor(colour);
        const count = Math.ceil(44 * 0.93);
        for (let i = 0; i < count; i++) {
          context
            .beginPath()
            .arc(
              0,
              0,
              128,
              -2.2 + (0.93 * Math.PI * 2 * i) / count,
              -2.2 + (0.93 * Math.PI * 2 * (i + 1)) / count + 0.01,
            )
            .stroke({
              color: paint.toNumber(),
              alpha: paint.alpha,
              width: 12.8 * (1 - (0.6 * i) / count),
              cap: 'round',
              join: 'miter',
            });
        }
        this.brushRings.set(colour, context);
      }
      const item = this.submit('brush-ring');
      item.context = context;
      this.applyTransform(item, this.composed(radius / 128, 0, 0, radius / 128, 0, 0));
      return true;
    });
    registerMaterialSink(this, {
      lights: (lighting) => {
        this.lighting = lighting;
      },
      draw: (stamp) => {
        const mesh = this.submit('material');
        const material = this.slots[this.cursor - 1]!.material!;
        const transform = this.composed(1, 0, 0, 1, stamp.x, stamp.y);
        material.update(
          {
            kind: 'sprite',
            texture: stamp.texture,
            material: stamp.material,
            transform,
            width: stamp.width,
            height: stamp.height,
            alpha: this.globalAlpha,
            tint: 0xffffff,
            blend: 'normal',
          },
          this.lighting,
          this.textures,
        );
        mesh.blendMode = this.blend();
      },
    });
    registerScenePathSink(this, (path) => {
      this.pendingEllipse = false;
      this.path = new GraphicsPath().addPath(new GraphicsPath(path), this.matrix.clone());
      this.fill();
    });
    registerSceneFilmPass(this, (film, w, h, time, preferences) => {
      if (film !== 'noir' && film !== 'trial-glitch') return false;
      this.stopRetainingTree();
      this.copyFilm ??= createCopyFilmPass();
      this.copyFilm.update(
        film,
        this.canvas.width,
        this.canvas.height,
        time,
        !!preferences.reducedMotion,
        !!preferences.reducedFlashes,
        w,
        h,
      );
      const group = new Container();
      // Pixi removeChildren returns removals in reverse order. Snapshot painter
      // order before detaching so the opaque background remains behind figures.
      const content = [...this.root.children];
      this.root.removeChildren();
      group.addChild(...content);
      group.filters = [this.copyFilm.filter];
      group.filterArea = new Rectangle(0, 0, this.canvas.width, this.canvas.height);
      this.root.addChild(group);
      this.transientGroups.push(group);
      return true;
    });
  }

  begin(): void {
    if (this.disposed) return;
    this.retainTree = this.transientGroups.length === 0 && this.clips.length === 0;
    if (!this.retainTree) this.root.removeChildren();
    for (const group of this.transientGroups) {
      group.mask = null;
      group.removeChildren();
      group.destroy();
    }
    this.transientGroups.length = 0;
    for (const clip of this.clips) clip.destroy();
    this.clips.length = 0;
    this.activeClips.length = 0;
    this.usedGradients.clear();
    this.usedPatterns.clear();
    this.stackDepth = 0;
    this.cursor = 0;
    this.textures.beginFrame();
    this.matrix.identity();
    this.beginPath();
  }

  flush(): void {
    if (this.disposed || this.contextLost) return;
    this.trimRetainedTree();
    if (this.width !== this.canvas.width || this.height !== this.canvas.height) {
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.renderer.resize(Math.max(1, this.width), Math.max(1, this.height), 1);
    }
    for (const slot of this.slots) {
      slot.material?.releaseLightTargets();
      slot.grass?.releaseLightTargets();
      slot.leaf?.releaseLightTargets();
    }
    this.artworkMaterials.detachTargets();
    this.lightBuffer.detachGeometry();
    this.drawGeometry();
    this.lightBuffer.render(this.geometryBuffer.targets!, {
      ...this.lighting,
      lightResolution: preferredLightResolution(
        this.canvas.dataset.lightResolution,
        this.lighting.lightResolution ?? 1,
      ),
    });
    this.canvas.dataset.lightBufferSize = `${this.lightBuffer.targets!.width}x${this.lightBuffer.targets!.height}`;
    // Pixi's back-buffer presentation blends onto the view without clearing it.
    // Explicitly clear the view too, so consecutive transparent frames in one
    // browser task do not accumulate (captures, previews and restoration).
    this.renderer.renderTarget.bind({
      target: this.renderer.view.renderTarget,
      clear: true,
      clearColor: [0, 0, 0, 0],
    });
    const debug = this.canvas.dataset.lightingView;
    const geometryView: GeometryDebugView =
      debug === 'g0' || debug === 'g1' || debug === 'g2' ? debug : 'none';
    const lightView = debug === 'diffuse' || debug === 'specular' ? debug : undefined;
    const view = lightView ?? geometryView;
    if (
      !(lightView
        ? this.lightBuffer.renderDebug(lightView)
        : this.geometryBuffer.renderDebug(geometryView))
    ) {
      this.artworkMaterials.prepare(this.geometryBuffer.targets!, this.lightBuffer.targets!);
      for (let i = 0; i < this.cursor; i++) {
        const slot = this.slots[i]!;
        slot.material?.prepareComposite(this.lightBuffer.targets!);
        slot.grass?.prepareComposite(this.lightBuffer.targets!);
        slot.leaf?.prepareComposite(this.lightBuffer.targets!);
        if (slot.item instanceof Graphics) this.artworkMaterials.attach(slot.item);
        if (slot.lookup) slot.lookup.update((slot.item as MeshSimple).texture);
      }
      this.renderer.render({ container: this.root, clear: true });
    }
    this.canvas.dataset.lightingFrameView = view;
    // Filter targets return to Pixi's pool after rendering. Drop the shared
    // bindings before a later resize destroys those pooled textures.
    const filterBindings: unknown = Reflect.get(this.renderer.filter, '_globalFilterBindGroup');
    if (filterBindings instanceof BindGroup) {
      filterBindings.setResource(Texture.EMPTY.source, 1);
      filterBindings.setResource(Texture.EMPTY.source.style, 2);
      filterBindings.setResource(Texture.EMPTY.source, 3);
    }
    // Unused pooled meshes must detach old scene sources before expiry destroys them.
    for (let i = this.cursor; i < this.slots.length; i++) {
      this.slots[i]?.material?.releaseTextures();
      this.slots[i]?.lookup?.releaseTexture();
      this.slots[i]?.leaf?.releaseTextures();
    }
    this.textures.collect();
    for (const [key, gradient] of this.gradients) {
      if (this.usedGradients.has(key)) continue;
      // Unload GPU storage without invalidating a source still referenced by
      // Pixi's last batch bind group. Its JS wrapper can then be collected.
      gradient.texture.source.unload();
      this.gradients.delete(key);
    }
    for (const key of this.patterns.keys())
      if (!this.usedPatterns.has(key)) this.patterns.delete(key);
  }

  private drawGeometry(): void {
    this.geometryBuffer.resize(this.canvas.width, this.canvas.height);
    const restore: (() => void)[] = [];
    try {
      // Reuse the exact transform and mask hierarchy; film/tint filters belong to composite.
      const visit = (item: Container) => {
        if (item.filters) {
          const filters = item.filters;
          item.filters = null;
          restore.push(() => {
            item.filters = [...filters];
          });
        }
        for (const child of item.children) visit(child);
      };
      visit(this.root);
      for (let i = 0; i < this.cursor; i++) {
        const slot = this.slots[i]!;
        if (slot.material || slot.grass || slot.leaf)
          restore.push(
            (slot.material ?? slot.grass ?? slot.leaf)!.beginGeometry(
              this.geometryBuffer.targets!.depthRange,
            ),
          );
        else {
          const renderable = slot.item.renderable;
          slot.item.renderable = false;
          restore.push(() => {
            slot.item.renderable = renderable;
          });
        }
      }
      this.geometryBuffer.render(this.root);
    } finally {
      for (let i = restore.length - 1; i >= 0; i--) restore[i]!();
    }
  }

  save(): void {
    let saved = this.stack[this.stackDepth++];
    if (!saved) {
      saved = { style: {} as DrawStyle, matrix: new Matrix(), clipDepth: 0 };
      this.stack[this.stackDepth - 1] = saved;
    }
    const style = saved.style as unknown as Record<string, unknown>;
    for (const key of styleKeys) style[key] = this[key];
    saved.matrix.copyFrom(this.matrix);
    saved.clipDepth = this.activeClips.length;
  }
  restore(): void {
    if (this.stackDepth === 0) return;
    const saved = this.stack[--this.stackDepth]!;
    const target = this as unknown as Record<string, unknown>;
    for (const key of styleKeys) target[key] = saved.style[key];
    this.matrix.copyFrom(saved.matrix);
    // Keep mask objects alive until their submitted draws have rendered.
    this.activeClips.length = saved.clipDepth;
    saved.style.fillStyle = saved.style.strokeStyle = '#000000';
  }
  private activeClips: Graphics[] = [];
  translate(x: number, y: number): void {
    const m = this.matrix;
    m.tx += m.a * x + m.c * y;
    m.ty += m.b * x + m.d * y;
  }
  rotate(angle: number): void {
    const c = Math.cos(angle),
      s = Math.sin(angle);
    this.transform(c, s, -s, c, 0, 0);
  }
  scale(x: number, y: number): void {
    this.matrix.a *= x;
    this.matrix.b *= x;
    this.matrix.c *= y;
    this.matrix.d *= y;
  }
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    const m = this.matrix;
    const ma = m.a,
      mb = m.b,
      mc = m.c,
      md = m.d;
    m.set(
      ma * a + mc * b,
      mb * a + md * b,
      ma * c + mc * d,
      mb * c + md * d,
      ma * e + mc * f + m.tx,
      mb * e + md * f + m.ty,
    );
  }
  setTransform(
    a?: number | DOMMatrix2DInit,
    b?: number,
    c?: number,
    d?: number,
    e?: number,
    f?: number,
  ): void {
    if (typeof a === 'number') this.matrix.set(a, b ?? 0, c ?? 0, d ?? 1, e ?? 0, f ?? 0);
    else this.matrix.set(a?.a ?? 1, a?.b ?? 0, a?.c ?? 0, a?.d ?? 1, a?.e ?? 0, a?.f ?? 0);
  }
  getTransform(): DOMMatrix {
    const m = this.matrix;
    return new DOMMatrix([m.a, m.b, m.c, m.d, m.tx, m.ty]);
  }
  private point(x: number, y: number): [number, number] {
    const m = this.matrix;
    return [m.a * x + m.c * y + m.tx, m.b * x + m.d * y + m.ty];
  }
  beginPath(): void {
    this.path = new GraphicsPath();
    this.pendingEllipse = false;
  }
  closePath(): void {
    this.materializeEllipse();
    this.path.closePath();
  }
  moveTo(x: number, y: number): void {
    this.materializeEllipse();
    this.path.moveTo(...this.point(x, y));
  }
  lineTo(x: number, y: number): void {
    this.materializeEllipse();
    this.path.lineTo(...this.point(x, y));
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void {
    this.materializeEllipse();
    this.path.quadraticCurveTo(...this.point(cx, cy), ...this.point(x, y));
  }
  bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number): void {
    this.materializeEllipse();
    this.path.bezierCurveTo(...this.point(a, b), ...this.point(c, d), ...this.point(x, y));
  }
  rect(x: number, y: number, w: number, h: number): void {
    // Bake coordinates like the other path commands. A retained Pixi shape
    // transform would also transform the global fill UVs a second time.
    this.moveTo(x, y);
    this.lineTo(x + w, y);
    this.lineTo(x + w, y + h);
    this.lineTo(x, y + h);
    this.closePath();
  }
  arc(x: number, y: number, r: number, start: number, end: number, ccw = false): void {
    this.addEllipse(this.composed(r, 0, 0, r, x, y), start, end, ccw);
  }
  ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    rotation: number,
    start: number,
    end: number,
    ccw = false,
  ): void {
    const c = Math.cos(rotation),
      s = Math.sin(rotation);
    const transform = this.composed(c * rx, s * rx, -s * ry, c * ry, x, y);
    this.addEllipse(transform, start, end, ccw);
  }
  private addEllipse(matrix: Matrix, start: number, end: number, ccw: boolean): void {
    if (
      !this.pendingEllipse &&
      this.path.instructions.length === 0 &&
      ((!ccw && end - start >= Math.PI * 2) || (ccw && start - end >= Math.PI * 2))
    ) {
      this.pendingEllipse = true;
      this.ellipseTransform.copyFrom(matrix);
      this.ellipseStart = start;
      this.ellipseEnd = end;
      this.ellipseCcw = ccw;
    } else {
      this.materializeEllipse();
      this.curveArc(matrix, start, end, ccw);
    }
  }
  private materializeEllipse(): void {
    if (!this.pendingEllipse) return;
    this.pendingEllipse = false;
    this.curveArc(this.ellipseTransform, this.ellipseStart, this.ellipseEnd, this.ellipseCcw);
  }
  private curveArc(m: Matrix, start: number, end: number, ccw: boolean): void {
    const tau = Math.PI * 2;
    let sweep = end - start;
    if (!ccw && sweep >= tau) sweep = tau;
    else if (ccw && -sweep >= tau) sweep = -tau;
    else if (ccw && sweep > 0) sweep = (sweep % tau) - tau;
    else if (!ccw && sweep < 0) sweep = (sweep % tau) + tau;
    const point = (x: number, y: number): [number, number] => [
      m.a * x + m.c * y + m.tx,
      m.b * x + m.d * y + m.ty,
    ];
    const first = point(Math.cos(start), Math.sin(start));
    if (this.path.instructions.length) this.path.lineTo(...first);
    else this.path.moveTo(...first);
    const steps = Math.ceil(Math.abs(sweep) / (Math.PI / 2));
    for (let i = 0; i < steps; i++) {
      const a = start + (sweep * i) / steps,
        b = start + (sweep * (i + 1)) / steps;
      const k = (4 / 3) * Math.tan((b - a) / 4);
      this.path.bezierCurveTo(
        ...point(Math.cos(a) - k * Math.sin(a), Math.sin(a) + k * Math.cos(a)),
        ...point(Math.cos(b) + k * Math.sin(b), Math.sin(b) - k * Math.cos(b)),
        ...point(Math.cos(b), Math.sin(b)),
      );
    }
  }

  private blend(): BLEND_MODES {
    if (this.globalCompositeOperation === 'source-over') return 'normal';
    if (this.globalCompositeOperation === 'lighter') return 'add';
    if (this.globalCompositeOperation === 'destination-out') return 'erase';
    if (this.globalCompositeOperation === 'copy') return 'none';
    const supported = ['multiply', 'screen', 'overlay', 'soft-light', 'color'];
    if (supported.includes(this.globalCompositeOperation))
      return this.globalCompositeOperation as BLEND_MODES;
    throw new Error(`Scene blend requires an explicit pass: ${this.globalCompositeOperation}`);
  }
  private composed(a: number, b: number, c: number, d: number, x: number, y: number): Matrix {
    const m = this.matrix;
    return this.scratch.set(
      m.a * a + m.c * b,
      m.b * a + m.d * b,
      m.a * c + m.c * d,
      m.b * c + m.d * d,
      m.a * x + m.c * y + m.tx,
      m.b * x + m.d * y + m.ty,
    );
  }
  private colour(value: string): Color {
    let colour = this.colours.get(value);
    if (!colour) {
      colour = sceneColor(value);
      if (this.colours.size >= 256) this.colours.delete(this.colours.keys().next().value!);
      this.colours.set(value, colour);
    }
    return colour;
  }
  private applyTransform(item: Container, matrix: Matrix): void {
    const slot = this.slots[this.cursor - 1]!;
    const { a, b, c, d, tx, ty } = matrix;
    if (
      slot.transformA === a &&
      slot.transformB === b &&
      slot.transformC === c &&
      slot.transformD === d &&
      slot.transformX === tx &&
      slot.transformY === ty
    )
      return;
    if (b === 0 && c === 0) {
      item.position.set(tx, ty);
      item.scale.set(a, d);
      item.rotation = 0;
      item.skew.set(0, 0);
    } else item.setFromMatrix(matrix);
    slot.transformA = a;
    slot.transformB = b;
    slot.transformC = c;
    slot.transformD = d;
    slot.transformX = tx;
    slot.transformY = ty;
  }
  private trimRetainedTree(): void {
    if (this.retainTree && this.root.children.length > this.cursor)
      this.root.removeChildren(this.cursor);
  }
  private stopRetainingTree(): void {
    this.trimRetainedTree();
    this.retainTree = false;
  }
  private submit(kind: 'leaf'): ReturnType<typeof createLeafMesh>['mesh'];
  private submit(kind: 'grass'): ReturnType<typeof createGrassMesh>['mesh'];
  private submit(kind: 'graphics'): Graphics;
  private submit(kind: 'sprite'): MeshSimple;
  private submit(kind: 'material'): MaterialMesh;
  private submit(kind: 'round-stroke'): MeshSimple;
  private submit(kind: 'brush-ring'): Graphics;
  private submit(kind: 'glyph-arrow'): Graphics;
  private submit(kind: 'ellipse'): MeshSimple;
  private submit(
    kind: Slot['kind'],
  ):
    | Graphics
    | MaterialMesh
    | MeshSimple
    | ReturnType<typeof createGrassMesh>['mesh']
    | ReturnType<typeof createLeafMesh>['mesh'] {
    let slot = this.slots[this.cursor];
    if (!slot || slot.kind !== kind) {
      for (const filter of slot?.filters ?? []) filter.destroy();
      slot?.lookup?.dispose();
      if (slot?.leaf) slot.leaf.dispose();
      else if (slot?.grass) slot.grass.dispose();
      else if (slot?.material) slot.material.dispose();
      else {
        if (slot?.item instanceof MeshSimple) slot.item.geometry.destroy();
        slot?.item.destroy();
      }
      const material = kind === 'material' ? createMaterialMesh() : undefined;
      const grass = kind === 'grass' ? createGrassMesh() : undefined;
      const leaf = kind === 'leaf' ? createLeafMesh() : undefined;
      slot = {
        kind,
        material,
        grass,
        leaf,
        item:
          leaf?.mesh ??
          grass?.mesh ??
          material?.mesh ??
          (kind === 'graphics' || kind === 'brush-ring' || kind === 'glyph-arrow'
            ? new Graphics()
            : kind === 'round-stroke'
              ? createRoundStroke(
                  (this.roundStrokeTexture ??= createRoundStrokeTexture(this.canvas.ownerDocument)),
                )
              : new MeshSimple({
                  texture:
                    kind === 'ellipse'
                      ? (this.roundStrokeTexture ??= createRoundStrokeTexture(
                          this.canvas.ownerDocument,
                        ))
                      : Texture.EMPTY,
                  vertices: new Float32Array(
                    kind === 'ellipse'
                      ? [-64, -64, 64, -64, 64, 64, -64, 64]
                      : [0, 0, 0, 0, 0, 0, 0, 0],
                  ),
                  uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
                  indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
                })),
      };
      if (!material && slot.item instanceof MeshSimple) {
        slot.lookup = this.artworkMaterials.createMesh();
        slot.item.shader = slot.lookup.shader;
      }
      this.slots[this.cursor] = slot;
    }
    this.cursor++;
    const item = slot.item;
    if (slot.filterKey !== this.filter) {
      for (const filter of slot.filters ?? []) filter.destroy();
      slot.filters = [];
      // These are the only preparation effects emitted by scene-kit. Keep the
      // vocabulary explicit rather than silently ignoring a new scene effect.
      for (const match of this.filter.matchAll(/(blur|grayscale)\(([\d.]+)(?:px)?\)/g)) {
        const amount = Number(match[2]);
        if (match[1] === 'blur')
          slot.filters.push(new BlurFilter({ strength: amount, quality: 4 }));
        else {
          const filter = new ColorMatrixFilter();
          filter.greyscale(amount, false);
          slot.filters.push(filter);
        }
      }
      slot.filterKey = this.filter;
      item.filters = slot.filters?.length ? slot.filters : null;
    }
    item.alpha = this.globalAlpha;
    item.blendMode = this.blend();
    // World-space paths only need to clear a prior shadow offset. Other draw
    // kinds supply their complete transform, so an identity decomposition is redundant.
    if (kind === 'graphics') {
      item.position.set(0, 0);
      (item as Graphics).clear();
    }
    let parent = this.root;
    for (const clip of this.activeClips) {
      const group = new Container();
      parent.addChild(group);
      group.mask = clip;
      this.transientGroups.push(group);
      parent = group;
    }
    if (this.retainTree && parent === this.root) {
      const index = this.cursor - 1;
      if (parent.children[index] !== item)
        parent.addChildAt(item, Math.min(index, parent.children.length));
    } else parent.addChild(item);
    return item;
  }
  private paint(
    style: string | CanvasGradient | CanvasPattern,
  ): FillStyle | FillGradient | FillPattern {
    if (typeof style === 'string') {
      const c = this.colour(style);
      return { color: c.toNumber(), alpha: c.alpha };
    }
    if (style instanceof Gradient) {
      const key = JSON.stringify([style.options, style.stops, style.matrix]);
      this.usedGradients.add(key);
      let gradient = this.gradients.get(key);
      if (!gradient) {
        gradient = new FillGradient({
          ...style.options,
          colorStops: style.stops,
          textureSpace: 'global',
        });
        gradient.buildGradient();
        gradient.transform.prepend(style.matrix);
        this.gradients.set(key, gradient);
      }
      return gradient;
    }
    if (style instanceof Pattern) {
      this.usedPatterns.add(style);
      const texture = this.textures.get({
        source: style.image,
        revision: sceneTextureRevision(style.image),
      });
      let pattern = this.patterns.get(style);
      if (!pattern) {
        pattern = new FillPattern({ texture, repetition: 'repeat', textureSpace: 'global' });
        this.patterns.set(style, pattern);
      }
      // Geometry is already in target coordinates. Capture the pattern transform
      // per draw so reusing a pattern later cannot move earlier submitted ink.
      return {
        texture,
        color: 0xffffff,
        textureSpace: 'global',
        matrix: this.matrix.clone().append(style.matrix),
      };
    }
    throw new Error('Scene gradients and patterns must be created on their target');
  }
  fill(pathOrRule?: Path2D | CanvasFillRule): void {
    if (pathOrRule && typeof pathOrRule !== 'string')
      throw new Error('Use fillScenePath for portable vector artwork');
    if (this.pendingEllipse && typeof this.fillStyle === 'string') {
      const item = this.submit('ellipse');
      const colour = this.colour(this.fillStyle);
      item.tint = colour.toNumber();
      item.alpha *= colour.alpha;
      const m = this.ellipseTransform;
      this.applyTransform(
        item,
        this.scratch.set(m.a / 64, m.b / 64, m.c / 64, m.d / 64, m.tx, m.ty),
      );
      return;
    }
    this.materializeEllipse();
    this.submit('graphics').path(this.path).fill(this.paint(this.fillStyle));
  }
  stroke(path?: Path2D): void {
    this.materializeEllipse();
    if (path) throw new Error('Use scene geometry for portable paths');
    const scale = Math.sqrt(
      Math.abs(this.matrix.a * this.matrix.d - this.matrix.b * this.matrix.c),
    );
    const paint = this.paint(this.strokeStyle);
    const style =
      paint instanceof FillGradient || paint instanceof FillPattern ? { fill: paint } : paint;
    const shadow = this.colour(this.shadowColor);
    const instructions = this.path.instructions;
    // Preserve native geometry for curves, multiple subpaths, gradients and
    // shadows. A single solid round-ended segment can reuse a batchable mesh.
    if (
      this.lineCap === 'round' &&
      typeof this.strokeStyle === 'string' &&
      shadow.alpha === 0 &&
      instructions.length === 2 &&
      instructions[0]!.action === 'moveTo' &&
      instructions[1]!.action === 'lineTo'
    ) {
      const [x, y] = instructions[0]!.data;
      const [endX, endY] = instructions[1]!.data;
      const width = this.lineWidth * scale;
      if (width > 0 && Number.isFinite(width) && Math.hypot(endX - x, endY - y) > 0) {
        const mesh = this.submit('round-stroke');
        updateRoundStroke(mesh, x, y, endX, endY, width);
        const color = this.colour(this.strokeStyle);
        mesh.tint = color.toNumber();
        mesh.alpha *= color.alpha;
        return;
      }
    }
    if (
      shadow.alpha > 0 &&
      (this.shadowBlur > 0 || this.shadowOffsetX !== 0 || this.shadowOffsetY !== 0)
    ) {
      const previousFilter = this.filter;
      this.filter = this.shadowBlur > 0 ? `blur(${this.shadowBlur / 2}px)` : 'none';
      const item = this.submit('graphics');
      item.position.set(this.shadowOffsetX, this.shadowOffsetY);
      item.path(this.path).stroke({
        color: shadow.toNumber(),
        alpha:
          shadow.alpha *
          (typeof this.strokeStyle === 'string' ? this.colour(this.strokeStyle).alpha : 1),
        width: this.lineWidth * scale,
        cap: this.lineCap,
        join: this.lineJoin,
      });
      this.filter = previousFilter;
    }
    this.submit('graphics')
      .path(this.path)
      .stroke({ ...style, width: this.lineWidth * scale, cap: this.lineCap, join: this.lineJoin });
  }
  clip(pathOrRule?: Path2D | CanvasFillRule): void {
    this.materializeEllipse();
    if (pathOrRule && typeof pathOrRule !== 'string')
      throw new Error('Use scene geometry for clip paths');
    this.stopRetainingTree();
    const mask = new Graphics().path(this.path).fill(0xffffff);
    this.root.addChild(mask);
    this.clips.push(mask);
    this.activeClips.push(mask);
  }
  fillRect(x: number, y: number, w: number, h: number): void {
    this.materializeEllipse();
    const path = this.path;
    this.beginPath();
    this.rect(x, y, w, h);
    this.fill();
    this.path = path;
  }
  strokeRect(x: number, y: number, w: number, h: number): void {
    this.materializeEllipse();
    const path = this.path;
    this.beginPath();
    this.rect(x, y, w, h);
    this.stroke();
    this.path = path;
  }
  clearRect(x: number, y: number, w: number, h: number): void {
    if (x === 0 && y === 0 && w >= this.canvas.width && h >= this.canvas.height) {
      this.begin();
      return;
    }
    this.save();
    this.globalCompositeOperation = 'destination-out';
    this.fillStyle = '#ffffff';
    this.fillRect(x, y, w, h);
    this.restore();
  }
  drawImage(
    image: CanvasImageSource,
    x: number,
    y: number,
    width?: number,
    height?: number,
    targetX?: number,
    targetY?: number,
    targetWidth?: number,
    targetHeight?: number,
  ): void {
    if (!(image instanceof HTMLImageElement || image instanceof HTMLCanvasElement))
      throw new Error('Scene sprites require prepared images or canvases');
    if (image === this.canvas) throw new Error('Scene feedback requires a separate render target');
    const iw = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
    const ih = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
    if (!iw || !ih) return;
    let sx = 0,
      sy = 0,
      sw = iw,
      sh = ih,
      dx = x,
      dy = y,
      dw = width ?? iw,
      dh = height ?? ih;
    if (targetX !== undefined) {
      sx = x;
      sy = y;
      sw = width!;
      sh = height!;
      dx = targetX;
      dy = targetY!;
      dw = targetWidth!;
      dh = targetHeight!;
    }
    if (!sw || !sh || !dw || !dh) return;
    const sprite = this.submit('sprite');
    const slot = this.slots[this.cursor - 1]!;
    const revision = sceneTextureRevision(image);
    if (
      slot.image !== image ||
      slot.revision !== revision ||
      slot.sx !== sx ||
      slot.sy !== sy ||
      slot.sw !== sw ||
      slot.sh !== sh ||
      sprite.texture.destroyed ||
      !this.textures.touch(image, revision)
    ) {
      sprite.texture = this.textures.getFrame(image, revision, sx, sy, sw, sh);
      sprite.vertices.set([0, 0, sw, 0, sw, sh, 0, sh]);
      slot.image = image;
      slot.revision = revision;
      slot.sx = sx;
      slot.sy = sy;
      slot.sw = sw;
      slot.sh = sh;
    }
    this.applyTransform(sprite, this.composed(dw / sw, 0, 0, dh / sh, dx, dy));
  }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient {
    return new Gradient(
      { type: 'linear', start: { x: x0, y: y0 }, end: { x: x1, y: y1 } },
      this.matrix.clone(),
    );
  }
  createRadialGradient(
    x0: number,
    y0: number,
    r0: number,
    x1: number,
    y1: number,
    r1: number,
  ): CanvasGradient {
    return new Gradient(
      {
        type: 'radial',
        center: { x: x0, y: y0 },
        outerCenter: { x: x1, y: y1 },
        innerRadius: r0,
        outerRadius: r1,
      },
      this.matrix.clone(),
    );
  }
  createPattern(image: CanvasImageSource, repeat: string | null): CanvasPattern | null {
    if (!(image instanceof HTMLImageElement || image instanceof HTMLCanvasElement)) return null;
    return new Pattern(image, repeat ?? 'repeat');
  }
  measureText(text: string): TextMetrics {
    this.measure.font = this.font;
    return this.measure.measureText(text);
  }
  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    this.text(text, x, y, false, maxWidth);
  }
  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    this.text(text, x, y, true, maxWidth);
  }
  private text(text: string, x: number, y: number, stroke: boolean, maxWidth?: number): void {
    const key = JSON.stringify([
      text,
      this.font,
      this.textAlign,
      this.textBaseline,
      this.fillStyle,
      this.strokeStyle,
      this.lineWidth,
      stroke,
      maxWidth,
    ]);
    let cached = this.textCache.get(key);
    if (!cached) {
      const g = this.measure;
      g.font = this.font;
      g.textAlign = this.textAlign;
      g.textBaseline = this.textBaseline;
      const m = g.measureText(text),
        padding = this.lineWidth + 2;
      const left = Math.ceil(m.actualBoundingBoxLeft + padding),
        top = Math.ceil(m.actualBoundingBoxAscent + padding);
      const c = this.canvas.ownerDocument.createElement('canvas');
      c.width = Math.max(1, Math.ceil(left + m.actualBoundingBoxRight + padding));
      c.height = Math.max(1, Math.ceil(top + m.actualBoundingBoxDescent + padding));
      const ink = c.getContext('2d')!;
      ink.font = this.font;
      ink.textAlign = this.textAlign;
      ink.textBaseline = this.textBaseline;
      ink.lineWidth = this.lineWidth;
      ink.lineJoin = this.lineJoin;
      if (typeof this.fillStyle === 'string') ink.fillStyle = this.fillStyle;
      if (typeof this.strokeStyle === 'string') ink.strokeStyle = this.strokeStyle;
      if (stroke) ink.strokeText(text, left, top, maxWidth);
      else ink.fillText(text, left, top, maxWidth);
      cached = { canvas: c, left, top };
      this.textCache.set(key, cached);
      if (this.textCache.size > 128) this.textCache.delete(this.textCache.keys().next().value!);
    }
    this.drawImage(cached.canvas, x - cached.left, y - cached.top);
  }
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener('webglcontextlost', this.loseContext);
    this.canvas.removeEventListener('webglcontextrestored', this.restoreContext);
    this.root.removeChildren();
    for (const group of this.transientGroups) {
      group.removeChildren();
      group.destroy();
    }
    for (const slot of this.slots) {
      slot.lookup?.dispose();
      if (slot.leaf) slot.leaf.dispose();
      else if (slot.grass) slot.grass.dispose();
      else if (slot.material) slot.material.dispose();
      else {
        if (slot.item instanceof MeshSimple) slot.item.geometry.destroy();
        slot.item.destroy();
      }
      for (const filter of slot.filters ?? []) filter.destroy();
    }
    for (const clip of this.clips) clip.destroy();
    // Pixi 8.22 FilterSystem.destroy omits its shared binding group's cleanup.
    // Detach it before the renderer's texture pool destroys its screen targets.
    // Keep this guarded adapter covered by the warning-sensitive disposal test.
    const filterBindings: unknown = Reflect.get(this.renderer.filter, '_globalFilterBindGroup');
    if (filterBindings instanceof BindGroup) filterBindings.destroy();
    this.artworkMaterials.dispose();
    this.lightBuffer.dispose();
    this.geometryBuffer.dispose();
    this.copyFilm?.filter.destroy();
    this.renderer.destroy({ removeView: false });
    // Native graphics retain Pixi cached batch bind groups beyond renderer disposal.
    // Release GPU storage as for retired gradients without invalidating their sources.
    for (const gradient of this.gradients.values()) gradient.texture.source.unload();
    this.gradients.clear();
    this.root.destroy();
    this.roundStrokeTexture?.destroy(true);
    this.textures.dispose();
    this.textCache.clear();
    for (const context of this.brushRings.values()) context.destroy();
    this.brushRings.clear();
    for (const context of this.glyphArrows.values()) context.destroy();
    this.glyphArrows.clear();
    this.colours.clear();
    this.stack.length = 0;
  }
}

export async function createPixiScenePainter(canvas: HTMLCanvasElement): Promise<PixiScenePainter> {
  const renderer = new WebGLRenderer<HTMLCanvasElement>();
  try {
    const context = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      stencil: true,
    });
    if (!context) throw new GraphicsUnsupportedError();
    requireGeometryBuffers(context);
    requireLightBuffers(context);
    await renderer.init({
      context,
      preferWebGLVersion: 2,
      canvas,
      width: Math.max(1, canvas.width),
      height: Math.max(1, canvas.height),
      resolution: 1,
      antialias: true,
      backgroundAlpha: 0,
      preserveDrawingBuffer: false,
      useBackBuffer: true,
    });
    return new PixiScenePainter(canvas, renderer);
  } catch (error) {
    try {
      renderer.destroy({ removeView: false });
    } catch {
      /* Partially initialized systems may have no GL context. */
    }
    throw error;
  }
}
