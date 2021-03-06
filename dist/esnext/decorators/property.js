import "reflect-metadata";
import { propertiesByModel } from "./decorator";
import { propertyReflector } from "./reflector";
export function constrainedProperty(options = {}) {
    return propertyReflector(Object.assign({}, options, { isRelationship: false, isProperty: true }), propertiesByModel);
}
/** allows the introduction of a new constraint to the metadata of a property */
export function constrain(prop, value) {
    return propertyReflector({ [prop]: value }, propertiesByModel);
}
export function desc(value) {
    return propertyReflector({ desc: value }, propertiesByModel);
}
export function min(value) {
    return propertyReflector({ min: value }, propertiesByModel);
}
export function mock(value) {
    return propertyReflector({ mockType: value }, propertiesByModel);
}
export function max(value) {
    return propertyReflector({ max: value }, propertiesByModel);
}
export function length(value) {
    return propertyReflector({ length: value }, propertiesByModel);
}
export const property = propertyReflector({
    isRelationship: false,
    isProperty: true
}, propertiesByModel);
export const pushKey = propertyReflector({ pushKey: true }, propertiesByModel);
//# sourceMappingURL=property.js.map