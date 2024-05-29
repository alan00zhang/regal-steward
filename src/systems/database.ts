// Database class with basic CRUD operations
export abstract class AbstractSystemDatabase<T> {
  public name: string;
  protected abstract _db: any;

  constructor(name: string) {
    this.name = name;
  }

  abstract get(value: T): T;
  abstract store(item: T): void;
  abstract delete(item: T): void;
  abstract deleteByIndex(index: number): void;
}

export class BasicSystemDatabase<T> extends AbstractSystemDatabase<T> {
  protected _db: T[];

  constructor(name: string) {
    super(name);
    this._db = [];
  }

  public get(value: T): T {
    return this._db.find(item => item === value);
  }

  public store(item: T): void {
    this._db.push(item);
  }

  public delete(item: T): void {
    let index = this._db.indexOf(item);
    if (index !== -1) this._db.splice(index, 1);
    else console.warn(`Could not find item ${item} in ${this.name} database!`);
  }

  public deleteByIndex(index: number): void {
    try {
      this._db.splice(index, 1);
    } catch(error) {
      console.warn(`Could not delete index ${index} in ${this.name} database!`);
    }
  }
}

export class UniqueSystemDatabase<T> extends BasicSystemDatabase<T> {
  constructor(name: string) {
    super(name);
  }

  has(item: T) {
    return this.get(item) !== undefined;
  }

  store(item: T, overwrite?: boolean) {
    let existingItem = this.get(item);
    if (!existingItem) {
      super.store(item);
    } else {
      if (overwrite) existingItem = item;
    }
  }
}