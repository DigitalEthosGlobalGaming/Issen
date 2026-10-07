export interface BehaviourDefinition<Record, Behaviour> {
  readonly matches: (record: Readonly<Record>) => boolean;
  readonly behaviour: Behaviour;
}

/** Ordered first-match resolution derives type from existing record data, so no
 * new discriminant or checkpoint migration is needed. Registration order is stable. */
export function createBehaviourRegistry<Record, Behaviour>() {
  const entries = new Map<string, BehaviourDefinition<Record, Behaviour>>();
  return {
    register(type: string, definition: BehaviourDefinition<Record, Behaviour>) {
      if (entries.has(type)) throw new Error(`Duplicate character behaviour: ${type}`);
      entries.set(type, definition);
    },
    get(type: string) {
      const definition = entries.get(type);
      if (!definition) throw new Error(`Unknown character behaviour: ${type}`);
      return definition.behaviour;
    },
    resolve(record: Readonly<Record>) {
      for (const [type, definition] of entries)
        if (definition.matches(record)) return { type, behaviour: definition.behaviour };
      throw new Error('No character behaviour matches the record');
    },
    types() {
      return [...entries.keys()];
    },
  };
}
