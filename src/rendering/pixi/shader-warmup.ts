import {
  defaultValue,
  extractAttributesFromGlProgram,
  getUboData,
  getUniformData,
  GlProgramData,
} from 'pixi.js';
import type { GlProgram, WebGLRenderer } from 'pixi.js';
import { nextVisibleFrame, paceTextureUploads } from '../texture-upload.ts';

/** Pixi8.22 adapter: defer reflection until KHR reports that linking is complete. */
export async function warmShaderPrograms(
  renderer: WebGLRenderer<HTMLCanvasElement>,
  programs: readonly GlProgram[],
  doc: Document,
  signal: AbortSignal,
  ready: () => boolean,
  generation: () => number,
): Promise<boolean> {
  const gl = renderer.gl as WebGL2RenderingContext;
  const extension = gl.getExtension('KHR_parallel_shader_compile') as {
    COMPLETION_STATUS_KHR: number;
  } | null;
  const initialGeneration = generation();
  const cache = Reflect.get(renderer.shader, '_programDataHash') as Record<number, GlProgramData>;
  if (!cache) throw Error('Pixi shader program cache is unavailable');
  const pending: {
    source: GlProgram;
    program: WebGLProgram;
    vertex: WebGLShader;
    fragment: WebGLShader;
    adopted: boolean;
  }[] = [];
  const nextFrame = (abort: AbortSignal) => nextVisibleFrame(doc, abort);
  try {
    const submitted = await paceTextureUploads(programs, signal, {
      nextFrame,
      ready,
      generation,
      upload(source) {
        if (cache[source._key] || generation() !== initialGeneration) return;
        const vertex = gl.createShader(gl.VERTEX_SHADER)!,
          fragment = gl.createShader(gl.FRAGMENT_SHADER)!;
        const program = gl.createProgram()!;
        pending.push({ source, program, vertex, fragment, adopted: false });
        gl.shaderSource(vertex, source.vertex!);
        gl.compileShader(vertex);
        gl.shaderSource(fragment, source.fragment!);
        gl.compileShader(fragment);
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        if (source.transformFeedbackVaryings)
          gl.transformFeedbackVaryings(
            program,
            source.transformFeedbackVaryings.names,
            source.transformFeedbackVaryings.bufferMode === 'separate'
              ? gl.SEPARATE_ATTRIBS
              : gl.INTERLEAVED_ATTRIBS,
          );
        gl.linkProgram(program);
      },
      now: () => performance.now(),
    });
    if (!submitted || generation() !== initialGeneration) return false;
    for (const entry of pending) {
      if (extension) {
        while (!gl.getProgramParameter(entry.program, extension.COMPLETION_STATUS_KHR)) {
          if (signal.aborted || !(await nextFrame(signal)) || generation() !== initialGeneration)
            return false;
          if (!ready()) continue;
        }
      }
      if (signal.aborted || !ready() || generation() !== initialGeneration) return false;
      if (!gl.getProgramParameter(entry.program, gl.LINK_STATUS))
        throw Error(`Scene shader link failed: ${gl.getProgramInfoLog(entry.program)}`);
      if (cache[entry.source._key]) continue;
      // Driver-assigned locations work for both ES100 and ES300; no second relink.
      entry.source._attributeData = extractAttributesFromGlProgram(entry.program, gl, false);
      entry.source._uniformData = getUniformData(entry.program, gl);
      entry.source._uniformBlockData = getUboData(entry.program, gl);
      const uniforms: ConstructorParameters<typeof GlProgramData>[1] = {};
      for (const name in entry.source._uniformData) {
        const data = entry.source._uniformData[name]!;
        uniforms[name] = {
          location: gl.getUniformLocation(entry.program, name)!,
          value: defaultValue(data.type, data.size),
        };
      }
      cache[entry.source._key] = new GlProgramData(entry.program, uniforms);
      entry.adopted = true;
    }
    return !signal.aborted && ready() && generation() === initialGeneration;
  } finally {
    if (generation() === initialGeneration)
      for (const entry of pending) {
        gl.deleteShader(entry.vertex);
        gl.deleteShader(entry.fragment);
        if (!entry.adopted) gl.deleteProgram(entry.program);
      }
  }
}
