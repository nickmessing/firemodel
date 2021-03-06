import { Model, IModelOptions } from "./Model";
import { Record } from "./Record";
import { SerializedQuery, IComparisonOperator } from "serialized-query";

import { epochWithMilliseconds, IDictionary } from "common-types";
import { FireModel } from "./FireModel";
// tslint:disable-next-line:no-implicit-dependencies
import { RealTimeDB } from "abstracted-firebase";
import { IReduxDispatch } from "./VuexWrapper";
import { pathJoin } from "./path";
import { getModelMeta } from "./ModelMeta";
import { FMEvents, IFMRecordListEvent } from "./state-mgmt";

const DEFAULT_IF_NOT_FOUND = "__DO_NOT_USE__";


function addTimestamps<T extends Model>(obj: IDictionary) {
  const datetime = new Date().getTime();
  const output: IDictionary = {};
  Object.keys(obj).forEach(i => {
    output[i] = {
      ...obj[i],
      createdAt: datetime,
      lastUpdated: datetime
    }
  });

  return output as T;
}
export class List<T extends Model> extends FireModel<T> {
  //#region STATIC Interfaces

  /**
   * Sets the default database to be used by all FireModel classes
   * unless explicitly told otherwise
   */
  public static set defaultDb(db: RealTimeDB) {
    FireModel.defaultDb = db;
  }

  public static get defaultDb() {
    return FireModel.defaultDb;
  }

  /**
   * Set
   *
   * Sets a given model to the payload passed in. This is
   * a destructive operation ... any other records of the
   * same type that existed beforehand are removed.
   */
    public static async set<T extends Model>(model: new () => T, payload: IDictionary<T>) {
    try {
      const m = Record.create(model);
      // If Auditing is one we must be more careful
      if(m.META.audit) {
        const existing = await List.all(model);
        if (existing.length > 0) {
          // TODO: need to write an appropriate AUDIT EVENT
          // TODO: implement
        } else {
          // LIST_SET event
          // TODO: need to write an appropriate AUDIT EVENT
          // TODO: implement
        }
      } else {
        // Without auditing we can just set the payload into the DB
        const datetime = new Date().getTime();
        await FireModel.defaultDb.set(`${m.META.dbOffset}/${m.pluralName}` , addTimestamps(payload));
      }

      const current = await List.all(model);
      return current;
    } catch (e) {
      const err = new Error(`Problem adding new Record: ${e.message}`);
      err.name = e.name !== "Error" ? e.name : "FireModel";
      throw e;
    }
  }

  public static set dispatch(fn: IReduxDispatch) {
    FireModel.dispatch = fn;
  }

  public static create<T extends Model>(
    model: new () => T,
    options: IModelOptions = {}
  ) {
    return new List<T>(model);
  }

  /**
   * Creates a List<T> which is populated with the passed in query
   *
   * @param schema the schema type
   * @param query the serialized query; note that this LIST will override the path of the query
   * @param options model options
   */
  public static async fromQuery<T extends Model>(
    model: new () => T,
    query: SerializedQuery,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const list = List.create(model, options);
    query.setPath(list.dbPath);

    await list.load(query);
    list.dispatch({
      type: FMEvents.RECORD_LIST,
      modelName: list.modelName,
      pluralName: list.pluralName,
      dbPath: list.dbPath,
      localPath: list.localPath,
      modelConstructor: list._modelConstructor,
      query,
      hashCode: query.hashCode(),
      records: list.data
    });
    return list;
  }

  /**
   * Loads all the records of a given schema-type ordered by lastUpdated
   *
   * @param schema the schema type
   * @param options model options
   */
  public static async all<T extends Model>(
    model: new () => T,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery().orderByChild("lastUpdated");
    const list = await List.fromQuery<T>(model, query, options);

    return list;
  }

  /**
   * Loads the first X records of the Schema type where
   * ordering is provided by the "createdAt" property
   *
   * @param model the model type
   * @param howMany the number of records to bring back
   * @param options model options
   */
  public static async first<T extends Model>(
    model: new () => T,
    howMany: number,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery()
      .orderByChild("createdAt")
      .limitToLast(howMany);
    const list = await List.fromQuery(model, query, options);

    return list;
  }

  /**
   * recent
   *
   * Get recent items of a given type/schema (based on lastUpdated)
   *
   * @param model the TYPE you are interested
   * @param howMany the quantity to of records to bring back
   * @param offset start at an offset position (useful for paging)
   * @param options
   */
  public static async recent<T extends Model>(
    model: new () => T,
    howMany: number,
    offset: number = 0,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery()
      .orderByChild("lastUpdated")
      .limitToFirst(howMany);
    const list = await List.fromQuery(model, query, options);

    return list;
  }

  /**
   * since
   *
   * Bring back all records that have changed since a given date
   *
   * @param schema the TYPE you are interested
   * @param since  the datetime in miliseconds
   * @param options
   */
  public static async since<T extends Model>(
    model: new () => T,
    since: epochWithMilliseconds,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    if (typeof since !== "number") {
      const e = new Error(
        `Invalid "since" parameter; value must be number instead got a(n) ${typeof since} [ ${since} ]`
      );
      e.name = "NotAllowed";
      throw e;
    }

    const query = new SerializedQuery<T>()
      .orderByChild("lastUpdated")
      .startAt(since);
    const list = await List.fromQuery(model, query, options);

    return list;
  }

  public static async inactive<T extends Model>(
    model: new () => T,
    howMany: number,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery()
      .orderByChild("lastUpdated")
      .limitToLast(howMany);
    const list = await List.fromQuery(model, query, options);

    return list;
  }

  public static async last<T extends Model>(
    model: new () => T,
    howMany: number,
    options: IModelOptions = {}
  ): Promise<List<T>> {
    const query = new SerializedQuery()
      .orderByChild("createdAt")
      .limitToFirst(howMany);
    const list = await List.fromQuery(model, query, options);

    return list;
  }

  public static async where<T extends Model, K extends keyof T>(
    model: new () => T,
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
    const query = new SerializedQuery()
      .orderByChild(property)
      .where(operation, val);
    const list = await List.fromQuery(model, query, options);

    return list;
  }

  //#endregion

  private _data: T[] = [];

  constructor(model: new () => T, options: IModelOptions = {}) {
    super();
    this._modelConstructor = model;
    this._model = new model();
    if (options.db) {
      this._db = options.db;
      if (!FireModel.defaultDb) {
        FireModel.defaultDb = options.db;
      }
    }
  }

  public get length(): number {
    return this._data.length;
  }

  public get dbPath() {
    return [this.META.dbOffset, this.pluralName].join("/");
  }

  public get localPath() {
    const meta = getModelMeta(this._model);
    return pathJoin(
      meta.localOffset,
      this.pluralName,
      meta.localPostfix
    ).replace(/\//g, ".");
  }

  public get localPathToSince() {
    const lp = this.META.localPostfix
      ? this.localPath.replace(`/${this.META.localPostfix}`, "")
      : this.localPath;
    return pathJoin(lp, "since");
  }

  /** Returns another List with data filtered down by passed in filter function */
  public filter(f: ListFilterFunction<T>) {
    const list = List.create(this._modelConstructor);
    list._data = this._data.filter(f);
    return list;
  }

  /** Returns another List with data filtered down by passed in filter function */
  public find(
    f: ListFilterFunction<T>,
    defaultIfNotFound = DEFAULT_IF_NOT_FOUND
  ): Record<T> {
    const filtered = this._data.filter(f);
    const r = Record.create(this._modelConstructor);
    if (filtered.length > 0) {
      r._initialize(filtered[0]);
      return r;
    } else {
      if (defaultIfNotFound !== DEFAULT_IF_NOT_FOUND) {
        return defaultIfNotFound as any;
      } else {
        const e = new Error(
          `find(fn) did not find a value in the List [ length: ${
            this.data.length
          } ]`
        );
        e.name = "NotFound";
        throw e;
      }
    }
  }

  public filterWhere<K extends keyof T>(prop: K, value: T[K]): List<T> {
    const whereFilter = (item: T) => item[prop] === value;

    const list = new List(this._modelConstructor);
    list._data = this.data.filter(whereFilter);
    return list;
  }

  public filterContains<K extends keyof T>(prop: K, value: any): List<T> {
    return this.filter((item: any) => Object.keys(item[prop]).includes(value));
  }

  /**
   * findWhere
   *
   * returns the first record in the list where the property equals the
   * specified value. If no value is found then an error is thrown unless
   * it is stated
   */
  public findWhere(
    prop: keyof T,
    value: T[typeof prop],
    defaultIfNotFound = DEFAULT_IF_NOT_FOUND
  ): Record<T> {
    const list =
      this.META.isProperty(prop) ||
      (this.META.isRelationship(prop) &&
        this.META.relationship(prop).relType === "hasOne")
        ? this.filterWhere(prop, value)
        : this.filterContains(prop, value);

    if (list.length > 0) {
      return Record.createWith(this._modelConstructor, list._data[0]);
    } else {
      if (defaultIfNotFound !== DEFAULT_IF_NOT_FOUND) {
        return defaultIfNotFound as any;
      } else {
        const valid =
          this.META.isProperty(prop) ||
          (this.META.isRelationship(prop) &&
            this.META.relationship(prop).relType === "hasOne")
            ? this.map(i => i[prop])
            : this.map(i => Object.keys(i[prop]));
        const e = new Error(
          `List<${
            this.modelName
          }>.findWhere(${prop}, ${value}) was not found in the List [ length: ${
            this.data.length
          } ]. \n\nValid values include: \n\n${valid.join("\t")}`
        );
        e.name = "NotFound";
        throw e;
      }
    }
  }

  /**
   * provides a map over the data structured managed by the List; there will be no mutations to the
   * data managed by the list
   */
  public map<K = any>(f: ListMapFunction<T, K>) {
    return this.data.map(f);
  }

  public get data() {
    return this._data;
  }

  /**
   * Returns the Record object with the given ID, errors if not found (name: NotFound)
   * unless call signature includes "defaultIfNotFound"
   *
   * @param id the unique ID which is being looked for
   * @param defaultIfNotFound the default value returned if the ID is not found in the list
   */
  public findById(
    id: string,
    defaultIfNotFound: any = DEFAULT_IF_NOT_FOUND
  ): Record<T> {
    const find = this.filter(f => f.id === id);
    if (find.length === 0) {
      if (defaultIfNotFound !== DEFAULT_IF_NOT_FOUND) {
        return defaultIfNotFound;
      }
      const e = new Error(
        `Could not find "${id}" in list of ${this.pluralName}`
      );
      e.name = "NotFound";
      throw e;
    }

    const r = Record.create(this._modelConstructor);
    r._initialize(find.data[0]);
    return r;
  }

  public async removeById(id: string, ignoreOnNotFound: boolean = false) {
    const rec = this.findById(id, null);
    if (!rec) {
      if (!ignoreOnNotFound) {
        const e = new Error(
          `Could not remove "${id}" in list of ${
            this.pluralName
          } as the ID was not found!`
        );
        e.name = "NotFound";
        throw e;
      } else {
        return;
      }
    }

    const removed = await Record.remove(this._modelConstructor, id, rec);
    this._data = this.filter(f => f.id !== id).data;
  }

  public async add(payload: T) {
    const newRecord = await Record.add(this._modelConstructor, payload);
    this._data.push(newRecord.data);
    return newRecord;
  }

  /**
   * Returns the single instance of an object contained by the List container
   *
   * @param id the unique ID which is being looked for
   * @param defaultIfNotFound the default value returned if the ID is not found in the list
   */
  public getData(id: string, defaultIfNotFound: any = DEFAULT_IF_NOT_FOUND): T {
    let record: Record<T>;
    try {
      record = this.findById(id, defaultIfNotFound);
      return record === defaultIfNotFound
        ? defaultIfNotFound
        : ((record as any).data as T);
    } catch (e) {
      if (e.name === "NotFound" && defaultIfNotFound !== DEFAULT_IF_NOT_FOUND) {
        return defaultIfNotFound;
      } else {
        throw e;
      }
    }
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
