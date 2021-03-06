import { Model, IModelOptions } from "./Model";
import { Record } from "./Record";
import { SerializedQuery, IComparisonOperator } from "serialized-query";
import { epochWithMilliseconds, IDictionary } from "common-types";
import { FireModel } from "./FireModel";
import { RealTimeDB } from "abstracted-firebase";
import { IReduxDispatch } from "./VuexWrapper";
export declare class List<T extends Model> extends FireModel<T> {
    /**
     * Sets the default database to be used by all FireModel classes
     * unless explicitly told otherwise
     */
    static defaultDb: RealTimeDB;
    /**
     * Set
     *
     * Sets a given model to the payload passed in. This is
     * a destructive operation ... any other records of the
     * same type that existed beforehand are removed.
     */
    static set<T extends Model>(model: new () => T, payload: IDictionary<T>): Promise<List<T>>;
    static dispatch: IReduxDispatch;
    static create<T extends Model>(model: new () => T, options?: IModelOptions): List<T>;
    /**
     * Creates a List<T> which is populated with the passed in query
     *
     * @param schema the schema type
     * @param query the serialized query; note that this LIST will override the path of the query
     * @param options model options
     */
    static fromQuery<T extends Model>(model: new () => T, query: SerializedQuery, options?: IModelOptions): Promise<List<T>>;
    /**
     * Loads all the records of a given schema-type ordered by lastUpdated
     *
     * @param schema the schema type
     * @param options model options
     */
    static all<T extends Model>(model: new () => T, options?: IModelOptions): Promise<List<T>>;
    /**
     * Loads the first X records of the Schema type where
     * ordering is provided by the "createdAt" property
     *
     * @param model the model type
     * @param howMany the number of records to bring back
     * @param options model options
     */
    static first<T extends Model>(model: new () => T, howMany: number, options?: IModelOptions): Promise<List<T>>;
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
    static recent<T extends Model>(model: new () => T, howMany: number, offset?: number, options?: IModelOptions): Promise<List<T>>;
    /**
     * since
     *
     * Bring back all records that have changed since a given date
     *
     * @param schema the TYPE you are interested
     * @param since  the datetime in miliseconds
     * @param options
     */
    static since<T extends Model>(model: new () => T, since: epochWithMilliseconds, options?: IModelOptions): Promise<List<T>>;
    static inactive<T extends Model>(model: new () => T, howMany: number, options?: IModelOptions): Promise<List<T>>;
    static last<T extends Model>(model: new () => T, howMany: number, options?: IModelOptions): Promise<List<T>>;
    static where<T extends Model, K extends keyof T>(model: new () => T, property: K, value: T[K] | [IComparisonOperator, T[K]], options?: IModelOptions): Promise<List<T>>;
    private _data;
    constructor(model: new () => T, options?: IModelOptions);
    readonly length: number;
    readonly dbPath: string;
    readonly localPath: any;
    readonly localPathToSince: any;
    /** Returns another List with data filtered down by passed in filter function */
    filter(f: ListFilterFunction<T>): List<T>;
    /** Returns another List with data filtered down by passed in filter function */
    find(f: ListFilterFunction<T>, defaultIfNotFound?: string): Record<T>;
    filterWhere<K extends keyof T>(prop: K, value: T[K]): List<T>;
    filterContains<K extends keyof T>(prop: K, value: any): List<T>;
    /**
     * findWhere
     *
     * returns the first record in the list where the property equals the
     * specified value. If no value is found then an error is thrown unless
     * it is stated
     */
    findWhere(prop: keyof T, value: T[typeof prop], defaultIfNotFound?: string): Record<T>;
    /**
     * provides a map over the data structured managed by the List; there will be no mutations to the
     * data managed by the list
     */
    map<K = any>(f: ListMapFunction<T, K>): K[];
    readonly data: T[];
    /**
     * Returns the Record object with the given ID, errors if not found (name: NotFound)
     * unless call signature includes "defaultIfNotFound"
     *
     * @param id the unique ID which is being looked for
     * @param defaultIfNotFound the default value returned if the ID is not found in the list
     */
    findById(id: string, defaultIfNotFound?: any): Record<T>;
    removeById(id: string, ignoreOnNotFound?: boolean): Promise<void>;
    add(payload: T): Promise<Record<T>>;
    /**
     * Returns the single instance of an object contained by the List container
     *
     * @param id the unique ID which is being looked for
     * @param defaultIfNotFound the default value returned if the ID is not found in the list
     */
    getData(id: string, defaultIfNotFound?: any): T;
    load(pathOrQuery: string | SerializedQuery<T>): Promise<this>;
}
export declare type ListFilterFunction<T> = (fc: T) => boolean;
export declare type ListMapFunction<T, K = any> = (fc: T) => K;
