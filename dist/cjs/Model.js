"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const constraints_1 = require("./decorators/constraints");
const indexing_1 = require("./decorators/indexing");
var RelationshipPolicy;
(function (RelationshipPolicy) {
    RelationshipPolicy["keys"] = "keys";
    RelationshipPolicy["lazy"] = "lazy";
    RelationshipPolicy["inline"] = "inline";
})(RelationshipPolicy = exports.RelationshipPolicy || (exports.RelationshipPolicy = {}));
var RelationshipCardinality;
(function (RelationshipCardinality) {
    RelationshipCardinality["hasMany"] = "hasMany";
    RelationshipCardinality["belongsTo"] = "belongsTo";
})(RelationshipCardinality = exports.RelationshipCardinality || (exports.RelationshipCardinality = {}));
class Model {
}
__decorate([
    constraints_1.property,
    indexing_1.uniqueIndex,
    __metadata("design:type", String)
], Model.prototype, "id", void 0);
__decorate([
    constraints_1.property,
    constraints_1.mock("dateRecentMiliseconds"),
    indexing_1.index,
    __metadata("design:type", Number)
], Model.prototype, "lastUpdated", void 0);
__decorate([
    constraints_1.property,
    constraints_1.mock("datePastMiliseconds"),
    indexing_1.index,
    __metadata("design:type", Number)
], Model.prototype, "createdAt", void 0);
exports.Model = Model;
//# sourceMappingURL=Model.js.map