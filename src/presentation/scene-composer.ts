export interface ScenePass<Frame, Views> {
  readonly name: string;
  readonly draw: (frame: Frame, views: Views) => void;
}
export type SceneNeighbour = { before: string; after?: never } | { after: string; before?: never };

/** Ordered painter passes. Every extension names its neighbour explicitly. */
export function createSceneComposer<Frame, Views>(initial: readonly ScenePass<Frame, Views>[]) {
  let passes = [...initial];
  const validateName = (name: string) => {
    if (!name || passes.some((pass) => pass.name === name))
      throw new Error(`Duplicate or empty scene pass: ${name}`);
  };
  const names = new Set<string>();
  for (const pass of passes) {
    if (!pass.name || names.has(pass.name))
      throw new Error(`Duplicate or empty scene pass: ${pass.name}`);
    names.add(pass.name);
  }
  return {
    get order(): readonly string[] {
      return passes.map((pass) => pass.name);
    },
    draw(frame: Frame, views: Views) {
      // Extensions installed while drawing take effect on the next frame.
      for (const pass of passes) pass.draw(frame, views);
    },
    insert(pass: ScenePass<Frame, Views>, neighbour: SceneNeighbour): () => void {
      if ('before' in neighbour === 'after' in neighbour)
        throw new Error('Scene insertion requires exactly one neighbour');
      validateName(pass.name);
      const anchor = neighbour.before ?? neighbour.after;
      const index = passes.findIndex((candidate) => candidate.name === anchor);
      if (index < 0) throw new Error(`Unknown scene neighbour: ${anchor}`);
      passes = [...passes];
      passes.splice(index + ('after' in neighbour ? 1 : 0), 0, pass);
      let installed = true;
      return () => {
        if (!installed) return;
        installed = false;
        passes = passes.filter((candidate) => candidate !== pass);
      };
    },
  };
}
