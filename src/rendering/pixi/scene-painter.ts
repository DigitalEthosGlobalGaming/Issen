import {
  Color,
  Container,
  FillGradient,
  FillPattern,
  Graphics,
  GraphicsPath,
  Matrix,
  Sprite,
  WebGLRenderer,
  Rectangle,
  BindGroup,
  BlurFilter,
  ColorMatrixFilter,
  Texture,
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

class Gradient implements CanvasGradient {
  readonly stops: { offset: number; color: string }[] = [];
  constructor(
    readonly options: GradientOptions,
    readonly matrix: Matrix,
  ) {}
  addColorStop(offset: number, color: string): void {
    this.stops.push({ offset, color });
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
  item: Graphics | Sprite | MaterialMesh;
  kind: 'graphics' | 'sprite' | 'material';
  material?: ReturnType<typeof createMaterialMesh>;
  filterKey?: string;
  filters?: (BlurFilter | ColorMatrixFilter)[];
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
  private readonly slots: Slot[] = [];
  private readonly gradients = new Map<string, FillGradient>();
  private readonly patterns = new Map<Pattern, FillPattern>();
  private readonly stack: { style: DrawStyle; matrix: Matrix; clips: Graphics[] }[] = [];
  private readonly matrix = new Matrix();
  private path = new GraphicsPath();
  private cursor = 0;
  private disposed = false;
  contextLost = false;
  private readonly loseContext = (event: Event) => {
    event.preventDefault();
    this.contextLost = true;
    this.canvas.dataset.contextState = 'lost';
  };
  private readonly restoreContext = () => {
    this.contextLost = false;
    this.canvas.dataset.contextState = 'ready';
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

  constructor(
    readonly canvas: HTMLCanvasElement,
    private readonly renderer: WebGLRenderer<HTMLCanvasElement>,
  ) {
    canvas.addEventListener('webglcontextlost', this.loseContext);
    canvas.addEventListener('webglcontextrestored', this.restoreContext);
    canvas.dataset.contextState = 'ready';
    this.measure = canvas.ownerDocument.createElement('canvas').getContext('2d')!;
    registerMaterialSink(this, {
      lights: (lighting) => {
        this.lighting = lighting;
      },
      draw: (stamp) => {
        const mesh = this.submit('material');
        const material = this.slots[this.cursor - 1]!.material!;
        const transform = this.matrix.clone().append(new Matrix(1, 0, 0, 1, stamp.x, stamp.y));
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
      this.path = new GraphicsPath().addPath(new GraphicsPath(path), this.matrix.clone());
      this.fill();
    });
    registerSceneFilmPass(this, (film, w, h, time, preferences) => {
      if (film !== 'noir' && film !== 'trial-glitch') return false;
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
    this.root.removeChildren();
    for (const group of this.transientGroups) {
      group.mask = null;
      group.removeChildren();
      group.destroy();
    }
    this.transientGroups.length = 0;
    for (const clip of this.clips) clip.destroy();
    this.clips.length = 0;
    this.activeClips = [];
    this.usedGradients.clear();
    this.usedPatterns.clear();
    this.stack.length = 0;
    this.cursor = 0;
    this.textures.beginFrame();
    this.matrix.identity();
    this.beginPath();
  }

  flush(): void {
    if (this.disposed || this.contextLost) return;
    if (this.width !== this.canvas.width || this.height !== this.canvas.height) {
      this.width = this.canvas.width;
      this.height = this.canvas.height;
      this.renderer.resize(Math.max(1, this.width), Math.max(1, this.height), 1);
    }
    // Pixi's back-buffer presentation blends onto the view without clearing it.
    // Explicitly clear the view too, so consecutive transparent frames in one
    // browser task do not accumulate (captures, previews and restoration).
    this.renderer.clear({ target: this.renderer.view.renderTarget, clearColor: [0, 0, 0, 0] });
    this.renderer.render({ container: this.root, clear: true });
    // Filter targets return to Pixi's pool after rendering. Drop the shared
    // bindings before a later resize destroys those pooled textures.
    const filterBindings: unknown = Reflect.get(this.renderer.filter, '_globalFilterBindGroup');
    if (filterBindings instanceof BindGroup) {
      filterBindings.setResource(Texture.EMPTY.source, 1);
      filterBindings.setResource(Texture.EMPTY.source.style, 2);
      filterBindings.setResource(Texture.EMPTY.source, 3);
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

  save(): void {
    const style = Object.fromEntries(styleKeys.map((key) => [key, this[key]])) as DrawStyle;
    this.stack.push({ style, matrix: this.matrix.clone(), clips: [...this.activeClips] });
  }
  restore(): void {
    const saved = this.stack.pop();
    if (!saved) return;
    Object.assign(this, saved.style);
    this.matrix.copyFrom(saved.matrix);
    // Keep mask objects alive until their submitted draws have rendered.
    this.activeClips = saved.clips;
  }
  private activeClips: Graphics[] = [];
  translate(x: number, y: number): void {
    this.matrix.append(new Matrix(1, 0, 0, 1, x, y));
  }
  rotate(angle: number): void {
    const c = Math.cos(angle),
      s = Math.sin(angle);
    this.matrix.append(new Matrix(c, s, -s, c, 0, 0));
  }
  scale(x: number, y: number): void {
    this.matrix.append(new Matrix(x, 0, 0, y, 0, 0));
  }
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    this.matrix.append(new Matrix(a, b, c, d, e, f));
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
  }
  closePath(): void {
    this.path.closePath();
  }
  moveTo(x: number, y: number): void {
    this.path.moveTo(...this.point(x, y));
  }
  lineTo(x: number, y: number): void {
    this.path.lineTo(...this.point(x, y));
  }
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void {
    this.path.quadraticCurveTo(...this.point(cx, cy), ...this.point(x, y));
  }
  bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number): void {
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
    this.curveArc(this.matrix.clone().append(new Matrix(r, 0, 0, r, x, y)), start, end, ccw);
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
    const transform = this.matrix.clone().append(new Matrix(c * rx, s * rx, -s * ry, c * ry, x, y));
    this.curveArc(transform, start, end, ccw);
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
  private submit(kind: 'graphics'): Graphics;
  private submit(kind: 'sprite'): Sprite;
  private submit(kind: 'material'): MaterialMesh;
  private submit(kind: 'graphics' | 'sprite' | 'material'): Graphics | Sprite | MaterialMesh {
    let slot = this.slots[this.cursor];
    if (!slot || slot.kind !== kind) {
      for (const filter of slot?.filters ?? []) filter.destroy();
      if (slot?.material) slot.material.dispose();
      else slot?.item.destroy();
      const material = kind === 'material' ? createMaterialMesh() : undefined;
      slot = {
        kind,
        material,
        item: material?.mesh ?? (kind === 'graphics' ? new Graphics() : new Sprite()),
      };
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
    }
    item.filters = slot.filters?.length ? slot.filters : null;
    item.alpha = this.globalAlpha;
    item.blendMode = this.blend();
    item.setFromMatrix(new Matrix());
    if (item instanceof Graphics) item.clear();
    let parent = this.root;
    for (const clip of this.activeClips) {
      const group = new Container();
      parent.addChild(group);
      group.mask = clip;
      this.transientGroups.push(group);
      parent = group;
    }
    parent.addChild(item);
    return item;
  }
  private paint(
    style: string | CanvasGradient | CanvasPattern,
  ): FillStyle | FillGradient | FillPattern {
    if (typeof style === 'string') {
      const c = new Color(style);
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
    this.submit('graphics').path(this.path).fill(this.paint(this.fillStyle));
  }
  stroke(path?: Path2D): void {
    if (path) throw new Error('Use scene geometry for portable paths');
    const scale = Math.sqrt(
      Math.abs(this.matrix.a * this.matrix.d - this.matrix.b * this.matrix.c),
    );
    const paint = this.paint(this.strokeStyle);
    const style =
      paint instanceof FillGradient || paint instanceof FillPattern ? { fill: paint } : paint;
    const shadow = new Color(this.shadowColor);
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
          (typeof this.strokeStyle === 'string' ? new Color(this.strokeStyle).alpha : 1),
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
    if (pathOrRule && typeof pathOrRule !== 'string')
      throw new Error('Use scene geometry for clip paths');
    const mask = new Graphics().path(this.path).fill(0xffffff);
    this.root.addChild(mask);
    this.clips.push(mask);
    this.activeClips.push(mask);
  }
  fillRect(x: number, y: number, w: number, h: number): void {
    const path = this.path;
    this.beginPath();
    this.rect(x, y, w, h);
    this.fill();
    this.path = path;
  }
  strokeRect(x: number, y: number, w: number, h: number): void {
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
  drawImage(image: CanvasImageSource, ...args: number[]): void {
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
      dx = args[0]!,
      dy = args[1]!,
      dw = args[2] ?? iw,
      dh = args[3] ?? ih;
    if (args.length === 8)
      [sx, sy, sw, sh, dx, dy, dw, dh] = args as [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
      ];
    if (!sw || !sh || !dw || !dh) return;
    const sprite = this.submit('sprite');
    sprite.texture = this.textures.get({
      source: image,
      revision: sceneTextureRevision(image),
      frame: [sx, sy, sw, sh],
    });
    sprite.setFromMatrix(this.matrix.clone().append(new Matrix(dw / sw, 0, 0, dh / sh, dx, dy)));
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
      if (slot.material) slot.material.dispose();
      else slot.item.destroy();
      for (const filter of slot.filters ?? []) filter.destroy();
    }
    for (const clip of this.clips) clip.destroy();
    // Pixi 8.22 FilterSystem.destroy omits its shared binding group's cleanup.
    // Detach it before the renderer's texture pool destroys its screen targets.
    // Keep this guarded adapter covered by the warning-sensitive disposal test.
    const filterBindings: unknown = Reflect.get(this.renderer.filter, '_globalFilterBindGroup');
    if (filterBindings instanceof BindGroup) filterBindings.destroy();
    this.copyFilm?.filter.destroy();
    this.renderer.destroy({ removeView: false });
    for (const gradient of this.gradients.values()) gradient.destroy();
    this.root.destroy();
    this.textures.dispose();
    this.textCache.clear();
  }
}

export async function createPixiScenePainter(canvas: HTMLCanvasElement): Promise<PixiScenePainter> {
  const renderer = new WebGLRenderer<HTMLCanvasElement>();
  try {
    await renderer.init({
      canvas,
      width: Math.max(1, canvas.width),
      height: Math.max(1, canvas.height),
      resolution: 1,
      antialias: true,
      backgroundAlpha: 0,
      preserveDrawingBuffer: false,
      useBackBuffer: true,
    });
  } catch (error) {
    try {
      renderer.destroy({ removeView: false });
    } catch {
      /* Partially initialized systems may have no GL context. */
    }
    throw error;
  }
  return new PixiScenePainter(canvas, renderer);
}
