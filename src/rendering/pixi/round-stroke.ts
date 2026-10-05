import { MeshSimple, Texture } from 'pixi.js';

/** One prepared circle supplies two semicircular caps and an opaque middle.
 * The three quads meet without overlapping, preserving translucent stroke alpha.
 */
export function createRoundStrokeTexture(document: Document): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const context = canvas.getContext('2d')!;
  context.fillStyle = '#fff';
  context.beginPath();
  context.arc(64, 64, 64, 0, Math.PI * 2);
  context.fill();
  return Texture.from(canvas);
}

export function createRoundStroke(texture: Texture): MeshSimple {
  return new MeshSimple({
    texture,
    vertices: new Float32Array(24),
    uvs: new Float32Array([
      0, 0, 0.5, 0, 0.5, 1, 0, 1, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0, 1, 0, 1, 1, 0.5,
      1,
    ]),
    indices: new Uint32Array([0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11]),
  });
}

export function updateRoundStroke(
  mesh: MeshSimple,
  x: number,
  y: number,
  endX: number,
  endY: number,
  width: number,
): void {
  const dx = endX - x,
    dy = endY - y;
  const length = Math.hypot(dx, dy),
    radius = width / 2;
  const vertices = mesh.vertices;
  for (let quad = 0; quad < 3; quad++) {
    const left = quad === 0 ? -radius : quad === 1 ? 0 : length;
    const right = quad === 0 ? 0 : quad === 1 ? length : length + radius;
    const offset = quad * 8;
    vertices[offset] = left;
    vertices[offset + 1] = -radius;
    vertices[offset + 2] = right;
    vertices[offset + 3] = -radius;
    vertices[offset + 4] = right;
    vertices[offset + 5] = radius;
    vertices[offset + 6] = left;
    vertices[offset + 7] = radius;
  }
  mesh.position.set(x, y);
  mesh.rotation = Math.atan2(dy, dx);
}
