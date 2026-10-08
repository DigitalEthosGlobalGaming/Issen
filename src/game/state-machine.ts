export interface Stateful<State extends string> {
  state: State;
  t: number;
}
export interface StateHandlers<Record, Context, State extends string> {
  enter?(record: Record, context: Context): void;
  update?(record: Record, context: Context, dt: number): void;
  exit?(record: Record, context: Context): void;
  next?(record: Record, context: Context): State | undefined;
}
export type StateTable<State extends string, Record extends Stateful<State>, Context> = Readonly<{
  [Key in State]: StateHandlers<Record, Context, State>;
}>;

/** Plain records retain their existing state/t fields. Owners advance their clocks
 * before dispatch because attack freeze/hazards and raw shadow clocks differ. */
export function createStateMachine<State extends string, Record extends Stateful<State>, Context>(
  table: StateTable<State, Record, Context>,
) {
  function definition(state: State) {
    if (!Object.hasOwn(table, state)) throw new Error(`Undefined character state: ${state}`);
    return table[state];
  }
  function transition(record: Record, next: State, context: Context) {
    const target = definition(next),
      current = definition(record.state);
    if (next === record.state) return;
    current.exit?.(record, context);
    record.state = next;
    record.t = 0;
    target.enter?.(record, context);
    definition(record.state);
  }
  return {
    table,
    transition,
    update(record: Record, context: Context, dt: number) {
      const previous = record.state,
        current = definition(previous);
      current.update?.(record, context, dt);
      definition(record.state);
      if (record.state === previous) {
        const next = current.next?.(record, context);
        if (next !== undefined) transition(record, next, context);
      }
    },
  };
}
