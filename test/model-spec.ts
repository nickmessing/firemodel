// tslint:disable:no-implicit-dependencies
import {
  Model,
  BaseSchema,
  Record,
  List,
  IAuditRecord,
  FirebaseCrudOperations
} from "../src/index";
import DB from "abstracted-admin";
import * as chai from "chai";
import * as helpers from "./testing/helpers";
const expect = chai.expect;
import "reflect-metadata";
import { Klass, ContainedKlass, SubKlass } from "./testing/klass";
import { Person } from "./testing/person";
import { Company } from "./testing/company";
import { VerboseError } from "../src/VerboseError";
import { get as getStackFrame, parse as stackParse } from "stack-trace";
import { ILogger } from "../src/model";

VerboseError.setStackParser((context: VerboseError) => stackParse(context));

describe("Model", () => {
  let db: DB;
  beforeEach(() => {
    db = new DB({ mocking: true });
    db.resetMockDb();
  });

  it("can act as a factory for a Record and Schema", () => {
    const k = new Model<Klass>(Klass, db);
    expect(k).to.be.an("object");
    expect(k.newRecord()).to.be.instanceOf(Record);
    expect(k.newRecord().data).to.be.instanceOf(BaseSchema);
    expect(k.newRecord().data).to.be.instanceOf(Klass);
  });

  it("can be created with create() static method", () => {
    const People = Model.create(Person);
    expect(People).to.be.instanceOf(Model);
    expect(People.modelName).to.equal("person");
    expect(People.pluralName).to.equal("people");
    expect(People.pushKeys).to.contain("tags");
  });

  it("can be created with create() static method, and logger specified", () => {
    const messages = [];
    const myLogger: ILogger = {
      log: (msg: string) => messages.push(msg),
      warn: (msg: string) => messages.push(msg),
      debug: (msg: string) => messages.push(msg),
      error: (msg: string) => messages.push(msg)
    };
    const People = Model.create(Person, { logger: myLogger });
    expect(People).to.be.instanceOf(Model);
    expect(People.modelName).to.equal("person");
    expect(People.pluralName).to.equal("people");
    expect(People.pushKeys).to.contain("tags");
  });

  it("modelName and pluralName properties are correct", () => {
    const person = new Model<Person>(Person, db);
    expect(person.modelName).to.equal("person");
    expect(person.pluralName).to.equal("people");
    person.pluralName = "testing";
    expect(person.pluralName).to.equal("testing");
  });

  it("newRecord() returns empty record, with schema META set", () => {
    const k = new Model<Klass>(Klass, db);
    const record = k.newRecord();
    expect(record.data.id).to.equal(undefined);
    expect(record.data.foo).to.equal(undefined);
    expect(record.data.META.dbOffset).to.equal("authenticated");
  });

  it("newRecord(obj) returns Record with data loaded", () => {
    const k = new Model<Klass>(Klass, db);
    const data = {
      foo: "test",
      bar: 12,
      foobar: "xyz",
      bar2: 24,
      bar3: 36,
      baz: {
        c1: 1
      },
      sub: "asdf",

      cb: () => undefined
    };
    const record = k.newRecord(data);
    expect(record.data.id).to.equal(undefined);
    expect(record.data.foo).to.equal("test");
  });

  it('newRecord() ... "existsOnDB" is set to false', () => {
    const k = new Model<Klass>(Klass, db);
    const data = { foo: "test", bar: 12 };
    const r1 = k.newRecord();
    const r2 = k.newRecord(data);
    expect(r1.existsOnDB).to.equal(false);
    expect(r2.existsOnDB).to.equal(false);
  });

  it("getRecord() retrieves a record from the DB", async () => {
    const PersonModel = new Model<Person>(Person, db);
    await db.set<Person>("/authenticated/people/1234", {
      name: "Billy Bob",
      age: 45
    });
    const billy = await PersonModel.getRecord("1234");
    expect(billy.existsOnDB).to.equal(true);
    expect(billy.data.name).to.equal("Billy Bob");
    expect(billy.data.age).to.equal(45);
  });

  it("findRecord(prop, val) works", async () => {
    db.mock
      .addSchema("person", h => () => ({
        name: h.faker.name.firstName(),
        age: h.faker.random.number({ min: 1, max: 99 })
      }))
      .pathPrefix("authenticated");
    db.mock.queueSchema<Person>("person", 20);
    db.mock.queueSchema<Person>("person", 1, { name: "Roger Rabbit" });
    db.mock.queueSchema<Person>("person", 2, { name: "John Smith", age: 100 });
    db.mock.generate();
    const PersonModel = new Model<Person>(Person, db);
    const roger = await PersonModel.findRecord("name", "Roger Rabbit");
    expect(roger).to.be.instanceof(Record);
    expect(roger.data.name).to.equal("Roger Rabbit");
    expect(roger.key).to.equal(roger.data.id);
    expect(roger.dbPath).to.contain(roger.data.id);
    expect(roger.dbPath).to.contain("authenticated/people");
    const john = await PersonModel.findRecord("name", "John Smith");
    expect(john.data.age).to.equal(100);
  });

  it(`findRecord() throws error if no record found`, async () => {
    db.mock
      .addSchema("person", h => () => ({
        name: h.faker.name.firstName(),
        age: h.faker.random.number({ min: 1, max: 99 })
      }))
      .pathPrefix("authenticated");
    db.mock.queueSchema<Person>("person", 50);
    const PersonModel = new Model<Person>(Person, db);
    try {
      const doesNotExist = await PersonModel.findRecord("age", 500);
      expect(false, "Should have thrown error when no result found").to.equal(true);
    } catch (e) {
      expect(e.code).to.equal("not-found");
    }
  });

  it("Model.getAll() retrieves a List of records from DB", async () => {
    db.mock
      .addSchema("person", h => () => ({
        name: h.faker.name.firstName(),
        age: h.faker.random.number({ min: 1, max: 99 })
      }))
      .pathPrefix("authenticated");
    db.mock.queueSchema<Person>("person", 50);
    db.mock.generate();
    const PersonModel = new Model<Person>(Person, db);
    const list = await PersonModel.getAll();
    expect(list).to.be.instanceof(List);
    expect(list.data).to.an("array");
    expect(list.length).to.equal(50);
    expect(list.data[0].name).to.be.a("string");
    expect(list.data[0].age).to.be.a("number");
    expect(list.meta.property("name").type).to.equal("String");
  });

  it("Model.getSome() works", async () => {
    db.mock
      .addSchema("person", h => () => ({
        name: h.faker.name.firstName(),
        age: h.faker.random.number({ min: 1, max: 99 })
      }))
      .pathPrefix("authenticated");
    db.mock.queueSchema<Person>("person", 50);
    db.mock.generate();
    const PersonModel = new Model<Person>(Person, db);
    const listRecent = await PersonModel.getSome()
      .limitToFirst(5)
      .execute();
    expect(listRecent.length).to.equal(5);
    expect(listRecent).to.be.instanceof(List);
    expect(listRecent.meta.property("name").type).to.equal("String");
  });
});
