// Diagnostic API event/declared-extent accounting, not physical GPU memory.
export function initTextureProbe() {
  const realm = globalThis;
  if (realm.__textureProbe) return realm.__textureProbe;
  const contexts = new WeakMap(),
    textures = new WeakMap(),
    surfaces = [],
    records = [];
  let installed = false;
  const totals = {
    created: 0,
    deleted: 0,
    allocationCalls: 0,
    uploadCalls: 0,
    uploadedPixels: 0,
    copyCalls: 0,
    unmodelledCalls: 0,
  };
  function context(gl) {
    let value = contexts.get(gl);
    if (!value) {
      value = { ref: new WeakRef(gl), name: `surface-${surfaces.length}`, bindings: new Map() };
      contexts.set(gl, value);
      surfaces.push(value);
    }
    return value;
  }
  function texture(gl, object) {
    if (!object) return null;
    let record = textures.get(object);
    if (!record) {
      record = {
        ref: new WeakRef(object),
        context: context(gl),
        levels: new Map(),
        deleted: false,
      };
      textures.set(object, record);
      records.push(record);
    }
    return record;
  }
  function allocation(gl, target, level, width, height) {
    const binding = target >= 34069 && target <= 34074 ? 34067 : target;
    const record = texture(gl, context(gl).bindings.get(binding));
    if (record) record.levels.set(`${target}:${level}`, Math.max(0, width * height) || 0);
  }
  function extent(source) {
    return [
      source?.naturalWidth ?? source?.videoWidth ?? source?.width ?? 0,
      source?.naturalHeight ?? source?.videoHeight ?? source?.height ?? 0,
    ];
  }
  function install() {
    if (installed) return;
    installed = true;
    for (const Constructor of [realm.WebGLRenderingContext, realm.WebGL2RenderingContext]) {
      if (!Constructor) continue;
      const prototype = Constructor.prototype;
      const wrap = (name, after) => {
        if (!Object.hasOwn(prototype, name) || typeof prototype[name] !== 'function') return;
        const native = prototype[name];
        prototype[name] = function (...args) {
          const result = native.apply(this, args);
          after(this, args, result);
          return result;
        };
      };
      wrap('createTexture', (gl, _args, result) => {
        if (result) {
          texture(gl, result);
          totals.created++;
        }
      });
      wrap('bindTexture', (gl, args) => context(gl).bindings.set(args[0], args[1]));
      wrap('deleteTexture', (gl, args) => {
        const record = textures.get(args[0]);
        if (record && !record.deleted) {
          record.deleted = true;
          totals.deleted++;
        }
        for (const [target, object] of context(gl).bindings)
          if (object === args[0]) context(gl).bindings.set(target, null);
      });
      wrap('texImage2D', (gl, args) => {
        totals.allocationCalls++;
        const [width, height] = args.length >= 9 ? [args[3], args[4]] : extent(args[5]);
        allocation(gl, args[0], args[1], width, height);
        if (args.length < 9 || args[8] != null) {
          totals.uploadCalls++;
          totals.uploadedPixels += width * height || 0;
        }
      });
      wrap('texStorage2D', (gl, args) => {
        totals.allocationCalls++;
        for (let level = 0; level < args[1]; level++)
          allocation(
            gl,
            args[0],
            level,
            Math.max(1, args[3] >> level),
            Math.max(1, args[4] >> level),
          );
      });
      wrap('texSubImage2D', (_gl, args) => {
        const [width, height] = args.length >= 9 ? [args[4], args[5]] : extent(args[6]);
        totals.uploadCalls++;
        totals.uploadedPixels += width * height || 0;
      });
      wrap('copyTexImage2D', (gl, args) => {
        totals.copyCalls++;
        totals.allocationCalls++;
        allocation(gl, args[0], args[1], args[5], args[6]);
      });
      wrap('copyTexSubImage2D', () => totals.copyCalls++);
      for (const name of [
        'texImage3D',
        'texStorage3D',
        'compressedTexImage2D',
        'compressedTexSubImage2D',
      ])
        wrap(name, () => totals.unmodelledCalls++);
    }
  }
  function snapshot() {
    const active = records.filter(
      (record) =>
        !record.deleted &&
        record.ref.deref() &&
        record.context.ref.deref() &&
        !record.context.ref.deref().isContextLost(),
    );
    return {
      installed,
      ...totals,
      activeTextures: active.length,
      nominalRgbaPixels: active.reduce(
        (sum, record) => sum + [...record.levels.values()].reduce((a, b) => a + b, 0),
        0,
      ),
      surfaces: surfaces.map((surface) => ({
        name: surface.ref.deref()?.canvas?.id || surface.name,
        activeTextures: active.filter((record) => record.context === surface).length,
        nominalRgbaPixels: active
          .filter((record) => record.context === surface)
          .reduce((sum, record) => sum + [...record.levels.values()].reduce((a, b) => a + b, 0), 0),
      })),
    };
  }
  const probe = (realm.__textureProbe = { install, snapshot });
  if (new URLSearchParams(realm.location?.search ?? '').has('textureCounters')) install();
  return probe;
}
