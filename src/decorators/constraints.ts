import "reflect-metadata";
import { IDictionary, PropertyDecorator } from "common-types";
import { propertyDecorator, propertiesByModel } from "./decorator";
import { propertyReflector } from "./reflector";
import { IFmModelMeta, IFmModelPropertyMeta } from "./schema";

export function constrainedProperty(options: IDictionary = {}) {
  return propertyReflector<IFmModelPropertyMeta>(
    {
      ...options,
      ...{ isRelationship: false, isProperty: true }
    },
    propertiesByModel
  );
}

/** allows the introduction of a new constraint to the metadata of a property */
export function constrain(prop: string, value: any) {
  return propertyReflector<IFmModelPropertyMeta>(
    { [prop]: value },
    propertiesByModel
  );
}

export function desc(value: string) {
  return propertyReflector<IFmModelPropertyMeta>(
    { desc: value },
    propertiesByModel
  );
}

export function min(value: number) {
  return propertyReflector<IFmModelPropertyMeta>(
    { min: value },
    propertiesByModel
  );
}

export type MockFunction = (context: import("firemock").MockHelper) => any;
export type FmMockType = string | MockFunction;

export function mock(value: FmMockType) {
  return propertyReflector<IFmModelPropertyMeta>(
    { mockType: value },
    propertiesByModel
  );
}

export function max(value: number) {
  return propertyReflector<IFmModelPropertyMeta>(
    { max: value },
    propertiesByModel
  );
}

export function length(value: number) {
  return propertyReflector<IFmModelPropertyMeta>(
    { length: value },
    propertiesByModel
  );
}

export const property = propertyReflector(
  {
    isRelationship: false,
    isProperty: true
  },
  propertiesByModel
);

export const pushKey = propertyReflector({ pushKey: true }, propertiesByModel);
