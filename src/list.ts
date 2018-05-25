// tslint:disable-next-line:no-implicit-dependencies
import { RealTimeDB } from "abstracted-firebase";
import { BaseSchema, ISchemaOptions, Record } from "./index";
import { SerializedQuery, IComparisonOperator } from "serialized-query";
import Model, { IModelOptions } from "./model";
import { DEFAULT_ENCODING } from "crypto";

export class List<T extends BaseSchema> {
  public static create<T extends BaseSchema>(
    schema: new () => T,
    options: IModelOptions = {}
  ) {
    const model = Model.create(schema, options);
    return new List<T>(model);
  }

  /**
   * Creates a List<T> which is populated with the passed in query
   *
   * @param schema the schema type
   * @param query the serialized query; note that this LIST will override the path of the query
   * @param options model options
   */
  public static async from<T extends BaseSchema>(
    schema: new () => T,
    query: SerializedQuery,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const model = Model.create(schema, options);
    query.setPath(model.dbPath);
    const list = List.create(schema, options);

    await list.load(query);
    return list;
  }

  /**
   * Loads all the records of a given schema-type ordered by lastUpdated
   *
   * @param schema the schema type
   * @param options model options
   */
  public static async all<T extends BaseSchema>(
    schema: new () => T,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery().orderByChild("lastUpdated");
    const list = await List.from(schema, query, options);

    return list;
  }

  /**
   * Loads the first X records of the Schema type where
   * ordering is provided by the "createdAt" property
   *
   * @param schema the schema type
   * @param howMany the number of records to bring back
   * @param options model options
   */
  public static async first<T extends BaseSchema>(
    schema: new () => T,
    howMany: number,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery().orderByChild("createdAt").limitToLast(howMany);
    const list = await List.from(schema, query, options);

    return list;
  }

  public static async recent<T extends BaseSchema>(
    schema: new () => T,
    howMany: number,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery().orderByChild("lastUpdated").limitToFirst(howMany);
    const list = await List.from(schema, query, options);

    return list;
  }

  public static async inactive<T extends BaseSchema>(
    schema: new () => T,
    howMany: number,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery().orderByChild("lastUpdated").limitToLast(howMany);
    const list = await List.from(schema, query, options);

    return list;
  }

  public static async last<T extends BaseSchema>(
    schema: new () => T,
    howMany: number,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery().orderByChild("createdAt").limitToFirst(howMany);
    const list = await List.from(schema, query, options);

    return list;
  }

  public static async where<T extends BaseSchema, K extends keyof T>(
    schema: new () => T,
    property: K,
    value: T[K] | [IComparisonOperator, T[K]],
    options: IModelOptions = {}
  ) {
    let operation: IComparisonOperator = "=";
    let val = value;
    if (Array.isArray(value)) {
      val = value[1];
      operation = value[0];
    }
    const query = new SerializedQuery().orderByChild(property).where(operation, val);
    const list = await List.from(schema, query, options);

    return list;
  }

  constructor(private _model: Model<T>, private _data: T[] = []) {}

  public get length(): number {
    return this._data.length;
  }

  protected get db() {
    return this._model.db;
  }

  public get modelName() {
    return this._model.modelName;
  }

  public get pluralName() {
    return this._model.pluralName;
  }

  public get dbPath() {
    return [this.meta.dbOffset, this.pluralName].join("/");
  }

  public get localPath() {
    return [this.meta.localOffset, this.pluralName].join("/");
  }

  public get meta(): ISchemaOptions {
    return this._model.schema.META;
  }

  /** Returns another List with data filtered down by passed in filter function */
  public filter(f: ListFilterFunction<T>) {
    return new List(this._model, this._data.filter(f));
  }

  /** Returns another List with data filtered down by passed in filter function */
  public find(f: ListFilterFunction<T>) {
    const filtered = this._data.filter(f);
    return filtered.length > 0 ? Record.add(this._model.schemaClass, filtered[0]) : null;
  }

  /** Maps the data in the list to a plain JS object. Note: maintaining a List container isn't practical as the transformed data structure might not be a defined schema type */
  public map<K = any>(f: ListMapFunction<T, K>) {
    return this._data.map(f);
  }

  public get data() {
    return this._data;
  }

  /**
   * Returns the specified record Record object
   *
   * @param id the unique ID which is being looked for
   */
  public get(id: string) {
    const find = this.filter(f => f.id === id);
    if (find.length === 0) {
      const e = new Error(`Could not find "${id}" in list of ${this._model.pluralName}`);
      e.name = "NotFound";
      throw e;
    }

    const r = new Record(this._model);
    r.initialize(find.data[0]);
    return r;
  }

  /**
   * Returns the specified record Model object
   *
   * @param id the unique ID which is being looked for
   */
  public getModel(id: string) {
    const record = this.get(id);
    return record.data;
  }

  public async load(pathOrQuery: string | SerializedQuery<T>) {
    if (!this.db) {
      const e = new Error(
        `The attempt to load data into a List requires that the DB property be initialized first!`
      );
      e.name = "NoDatabase";
      throw e;
    }
    this._data = await this.db.getList<T>(pathOrQuery);
    return this;
  }
}

export type ListFilterFunction<T> = (fc: T) => boolean;
export type ListMapFunction<T, K = any> = (fc: T) => K;
