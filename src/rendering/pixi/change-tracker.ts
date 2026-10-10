/** Retained ordered values: compare mutable inputs without per-frame snapshots. */
export class ChangeTracker {
  private readonly previous: unknown[] = [];
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
    if (this.cursor >= this.previous.length || this.previous[this.cursor] !== value) {
      this.previous[this.cursor] = value;
      this.changed = true;
    }
    this.cursor++;
  }

  numbers(values: ArrayLike<number>): void {
    this.value(values.length);
    for (let i = 0; i < values.length; i++) this.value(values[i]);
  }

  finish(): boolean {
    if (this.previous.length !== this.cursor) {
      this.previous.length = this.cursor;
      this.changed = true;
    }
    return this.changed;
  }

  acknowledge(): void {
    this.changed = false;
  }

  clear(): void {
    this.previous.length = this.cursor = 0;
    this.changed = false;
  }
}
