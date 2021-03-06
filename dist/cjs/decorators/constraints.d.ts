import "reflect-metadata";
import { IDictionary } from "common-types";
export declare function constrainedProperty(options?: IDictionary): (modelKlass: import("..").Model, key: string) => void;
/** allows the introduction of a new constraint to the metadata of a property */
export declare function constrain(prop: string, value: any): (modelKlass: import("..").Model, key: string) => void;
export declare function desc(value: string): (modelKlass: import("..").Model, key: string) => void;
export declare function min(value: number): (modelKlass: import("..").Model, key: string) => void;
export declare type MockFunction = (context: import("firemock").MockHelper) => any;
export declare type FmMockType = string | MockFunction;
export declare function mock(value: FmMockType): (modelKlass: import("..").Model, key: string) => void;
export declare function max(value: number): (modelKlass: import("..").Model, key: string) => void;
export declare function length(value: number): (modelKlass: import("..").Model, key: string) => void;
export declare const property: (modelKlass: import("..").Model, key: string) => void;
export declare const pushKey: (modelKlass: import("..").Model, key: string) => void;
