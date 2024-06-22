import { PrimaryKeyObject } from "../types.js";

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

// Basic database (array-based)
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

// Unique database, uniqueness is evaluated on total equality (===)
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
      else throw new Error(`Tried to store ${item}, but item already exists in DB ${this.name}. Try specifying overwrite flag.`)
    }
  }
}

// Unique database, uniqueness is based on item.key's value. There can be many similar items as long as item.key is different
export class UniqueKeySystemDatabase<Key extends string> extends BasicSystemDatabase<PrimaryKeyObject<Key>> {
  primaryKey: Key;
  
  constructor(name: string, key: Key) {
    super(name);
    this.primaryKey = key;
  }

  getByID(pKeyValue: any) {
    return this._db.find(item => item[this.primaryKey] === pKeyValue);
  }
  
  has(pKeyValue: any) {
    return this.getByID(pKeyValue) !== undefined;
  }

  store(item: PrimaryKeyObject<Key>, overwrite?: boolean) {
    let existingItem = this.getByID(item[this.primaryKey]);
    if (!existingItem) {
      super.store(item);
    } else {
      if (overwrite) existingItem = item;
      else throw new Error(`Tried to store item with key ${item[this.primaryKey]}, but item already exists in DB ${this.name}. Try specifying overwrite flag.`)
    }
  }

  deleteByID(pKeyValue: any) {
    let index = this._db.indexOf(this.getByID(pKeyValue));
    if (index !== 1) {
      this.deleteByIndex(index);
    } else {
      console.warn(`Could not delete item with value ${pKeyValue} in ${this.name} database!`)
    }
  }
}