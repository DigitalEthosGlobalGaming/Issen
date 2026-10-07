/** Forward only named state fields; preserve deferred service getters without reading them. */
export function stateView<State extends object, Key extends keyof State, Ports extends object>(
  state: State,
  keys: readonly Key[],
  ports: Ports,
): Pick<State, Key> & NoInfer<Ports> {
  const view = Object.create(Object.getPrototypeOf(ports), Object.getOwnPropertyDescriptors(ports));
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(ports, key))
      throw new Error('Duplicate state view field: ' + String(key));
    Object.defineProperty(view, key, {
      enumerable: true,
      configurable: true,
      get: () => state[key],
      set: (value: State[Key]) => {
        state[key] = value;
      },
    });
  }
  return view;
}
