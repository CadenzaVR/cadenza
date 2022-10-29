import PooledNoteManager from "./PooledNoteManager";

export default abstract class ArrayPooledNoteManager<
  T
> extends PooledNoteManager<T> {
  protected pool: T[];

  constructor(pool: T[]) {
    super();
    this.pool = pool;
  }

  getInstanceFromPool(): T {
    return this.pool.pop();
  }

  releaseInstanceToPool(instance: T): void {
    this.pool.push(instance);
  }
}
