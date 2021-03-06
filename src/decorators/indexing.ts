import "reflect-metadata";
import { IDictionary } from "common-types";
import { propertyReflector } from "./reflector";
import { hashToArray } from "typed-conversions";

export interface IModelIndexMeta {
  isIndex: boolean;
  isUniqueIndex: boolean;
  desc?: string;
  property: string;
}

/** DB Indexes accumlated by index decorators */
export const indexesForModel: IDictionary<IDictionary<IModelIndexMeta>> = {};

/**
 * Gets all the db indexes for a given model
 */
export function getDbIndexes<T>(modelKlass: object): IModelIndexMeta[] {
  const modelName = modelKlass.constructor.name;

  return modelName === "Model"
    ? hashToArray<IModelIndexMeta>(indexesForModel[modelName])
    : (hashToArray<IModelIndexMeta>(indexesForModel[modelName]) || []).concat(
        hashToArray<IModelIndexMeta>(indexesForModel.Model)
      );
}

export const index = propertyReflector<IModelIndexMeta>(
  {
    isIndex: true,
    isUniqueIndex: false
  },
  indexesForModel
);

export const uniqueIndex = propertyReflector<IModelIndexMeta>(
  {
    isIndex: true,
    isUniqueIndex: true
  },
  indexesForModel
);
