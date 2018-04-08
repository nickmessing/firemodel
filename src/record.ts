// tslint:disable-next-line:no-implicit-dependencies
import { RealTimeDB } from "abstracted-firebase";
import { BaseSchema, ISchemaOptions } from "./index";
import { slashNotation, createError } from "./util";
import { VerboseError } from "./VerboseError";
import { IDictionary } from "common-types";
import Model, { ILogger } from "./model";
import { key as fbk } from "firebase-key";

export interface IWriteOperation {
  id: string;
  type: "set" | "pushKey" | "update";
  /** The database path being written to */
  path: string;
  /** The new value being written to database */
  value: any;
  /** called on positive confirmation received from server */
  callback: (type: string, value: any) => void;
}

export interface IRecordOptions {
  db?: RealTimeDB;
  logging?: ILogger;
  id?: string;
}

export class Record<T extends BaseSchema> {
  public static create<T extends BaseSchema>(schema: new () => T, options: IRecordOptions = {}) {
    const schemaClass = new schema();
    const model = Model.create(schema, options);
    const record = new Record<T>(model, options);

    return record;
  }

  public static async get<T extends BaseSchema>(
    schema: new () => T,
    id: string,
    options: IRecordOptions = {}
  ) {
    const record = Record.create(schema, options);
    record.load(id);
    return record;
  }

  private _existsOnDB: boolean = false;
  private _writeOperations: IWriteOperation[] = [];
  private _data?: Partial<T>;
  private _db: RealTimeDB;

  constructor(private _model: Model<T>, data: any = {}) {
    this._data = new _model.schemaClass();
    if (data) {
      this.initialize(data);
    }
  }

  public get data() {
    return this._data;
  }

  public get isDirty() {
    return this._writeOperations.length > 0 ? true : false;
  }

  public get META(): ISchemaOptions {
    return this._model.schema.META;
  }

  protected get db() {
    return this._model.db;
  }

  protected get pluralName() {
    return this._model.pluralName;
  }

  protected get pushKeys() {
    return this._model.schema.META.pushKeys;
  }

  public get dbPath() {
    if (!this.data.id) {
      throw createError(
        null,
        "record/invalid-path",
        `Invalid Record Path: you can not ask for the dbPath before setting an "id" property.`
      );
    }
    return [this.data.META.dbOffset, this.pluralName, this.data.id].join("/");
  }

  public get modelName() {
    return this.data.constructor.name.toLowerCase();
  }

  /** The Record's primary key */
  public get id() {
    if (!this.data.id) {
      throw new Error("key is not set yet!");
    }
    return this.data.id;
  }

  public get localPath() {
    if (!this.data.id) {
      throw new Error(
        'Invalid Path: you can not ask for the dbPath before setting an "id" property.'
      );
    }
    return [this.data.META.localOffset, this.pluralName, this.data.id].join("/");
  }

  public initialize(data: T) {
    Object.keys(data).map((key: keyof T) => {
      this._data[key] = data[key];
    });
  }

  public get existsOnDB() {
    return this.data && this.data.id ? true : false;
  }

  public async load(id: string) {
    this._data.id = id;
    const data = await this.db.getRecord<T>(this.dbPath);

    if (data && data.id) {
      this.initialize(data);
    } else {
      throw new Error(
        `Unknown Key: the key "${id}" was not found in Firebase at "${this.dbPath}".`
      );
    }

    return this;
  }

  public async update(hash: Partial<T>) {
    if (!this.data.id || !this._existsOnDB) {
      throw new Error(
        `Invalid Operation: you can not update a record which doesn't have an "id" or which has never been saved to the database`
      );
    }

    return this.db.update<T>(this.dbPath, hash);
  }

  /**
   * Pushes new values onto properties on the record
   * which have been stated to be a "pushKey"
   */
  public async pushKey<K extends keyof T>(property: K, value: T[K][keyof T[K]]) {
    if (this.META.pushKeys.indexOf(property) === -1) {
      throw new Error(
        `Invalid Operation: you can not push to property "${property}" as it has not been declared a pushKey property in the schema`
      );
    }

    if (!this.existsOnDB) {
      throw new Error(
        `Invalid Operation: you can not push to property "${property}" before saving the record to the database`
      );
    }
    const pushKey = fbk();
    const currentState = this.get(property) || {};
    const newState = { ...(currentState as any), [pushKey]: value };
    // set state locally
    this.set(property, newState);

    try {
      await this.db.set<T[K][keyof T[K]]>(slashNotation(this.dbPath, property), newState);
    } catch (e) {
      throw createError(
        e,
        "failed-pushkey",
        `There was a problem pushing a ${typeof value} onto the path "${this.dbPath}/${property}"`
      );
    }
    try {
      await this.db.set<string>(
        `${slashNotation(this.dbPath)}/lastUpdated`,
        new Date().toISOString()
      );
    } catch (e) {
      console.warn(
        `Pushkey was successfully pushed but couldn't update the record's [ ${
          this.id
        } ] lastUpdate field`
      );
    }

    this.addWriteOperation({
      type: "pushKey"
    });

    return pushKey;
  }

  /**
   * Changes the local state of a property on the record
   *
   * @param prop the property on the record to be changed
   * @param value the new value to set to
   */
  public set<K extends keyof T>(prop: K, value: T[K]) {
    this.data[prop] = value;
    return this;
  }

  /**
   * get a property value from the record
   *
   * @param prop the property being retrieved
   */
  public get<K extends keyof T>(prop: K) {
    return this.data[prop];
  }

  public toString() {
    return `Record::${this.modelName}@${this.id || "undefined"}`;
  }

  public toJSON() {
    return {
      dbPath: this.dbPath,
      modelName: this.modelName,
      pluralName: this.pluralName,
      key: this.id,
      localPath: this.localPath,
      data: this.data.toString()
    };
  }

  private addWriteOperation(op: Promise<void>, meta: IWriteOperation) {
    const id = fbk();

    this._writeOperations.push({
      ...meta,
      ...{ id }
    });
  }
}
