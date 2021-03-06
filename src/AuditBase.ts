import { Model, IModelOptions } from "./Model";
import { FireModel } from "./FireModel";
import { Record } from "./Record";
import { pathJoin } from "./path";
import { RealTimeDB } from "abstracted-firebase";
import { SerializedQuery } from "serialized-query";

export class AuditBase<T extends Model = Model> {
  protected _modelKlass: new () => T;
  protected _record: Record<T>;
  protected _db: RealTimeDB;
  protected _query: SerializedQuery;
  // index searchs (future)
  protected _recordId: string;
  protected _property: string;

  protected get db(): RealTimeDB {
    return this._db;
  }

  protected get dbPath() {
    return pathJoin(FireModel.auditLogs, this._record.pluralName);
  }

  constructor(modelKlass: new () => T, options: IModelOptions = {}) {
    this._modelKlass = modelKlass;
    this._record = Record.create(modelKlass);
    this._db = options.db || FireModel.defaultDb;
  }
}
