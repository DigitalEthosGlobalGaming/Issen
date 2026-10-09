import { BigPool, GraphicsContextRenderData } from 'pixi.js';
import type { WebGLRenderer } from 'pixi.js';

// Pixi 8.22 allocates globally cached WebGPU texture bind groups even for WebGL.
// GlGraphicsAdaptor binds batch textures directly and never reads those groups.
// Keep Pixi's pooled geometry/batcher lifecycle, omitting only the unused groups.
export function installWebGLGraphicsData(renderer: WebGLRenderer<HTMLCanvasElement>): void {
  const system = renderer.graphicsContext;
  system.getContextRenderData = (context) => {
    const gpu = system.getGpuContext(context);
    if (gpu.graphicsData) return gpu.graphicsData;
    const data = BigPool.get(GraphicsContextRenderData, {
      maxTextures: renderer.limits.maxBatchableTextures,
    });
    gpu.graphicsData = data;
    const { batches, geometryData } = gpu;
    for (const batch of batches) batch.applyTransform = false;
    const batcher = data.batcher;
    batcher.ensureAttributeBuffer(geometryData.vertices.length);
    batcher.ensureIndexBuffer(geometryData.indices.length);
    batcher.begin();
    for (const batch of batches) batcher.add(batch);
    batcher.finish(data.instructions);
    batcher.geometry.indexBuffer.setDataWithSize(batcher.indexBuffer, batcher.indexSize, true);
    batcher.geometry.buffers[0]!.setDataWithSize(
      batcher.attributeBuffer.float32View,
      batcher.attributeSize,
      true,
    );
    return data;
  };
}
