/** Retained ordered values: compare mutable inputs without per-frame snapshots. */
export class ChangeTracker {
  private readonly previous: unknown[] = [];
  private numeric = new Float64Array(64);
  private kinds = new Uint8Array(64);
  private count = 0;
  private cursor = 0;
  private changed = false;
  get pending(): boolean {
    return this.changed;
  }

  begin(): void {
    this.cursor = 0;
    this.changed = false;
  }

  value(value: unknown): void {
    const index = this.cursor++;
    if (index >= this.kinds.length) {
      const numeric = new Float64Array(this.kinds.length * 2);
      numeric.set(this.numeric);
      this.numeric = numeric;
      const kinds = new Uint8Array(numeric.length);
      kinds.set(this.kinds);
      this.kinds = kinds;
    }
    if (typeof value === 'number') {
      if (index >= this.count || this.kinds[index] !== 1 || this.numeric[index] !== value) {
        this.numeric[index] = value;
        this.kinds[index] = 1;
        this.previous[index] = undefined;
        this.changed = true;
      }
    } else if (index >= this.count || this.kinds[index] !== 2 || this.previous[index] !== value) {
      this.previous[index] = value;
      this.kinds[index] = 2;
      this.changed = true;
    }
  }

  numbers(values: ArrayLike<number>): void {
    this.value(values.length);
    for (let i = 0; i < values.length; i++) this.value(values[i]);
  }

  finish(): boolean {
    if (this.count !== this.cursor) {
      this.previous.length = Math.min(this.previous.length, this.cursor);
      this.count = this.cursor;
      this.changed = true;
    }
    return this.changed;
  }

  acknowledge(): void {
    this.changed = false;
  }

  clear(): void {
    this.previous.length = this.cursor = this.count = 0;
    this.changed = false;
  }
}
