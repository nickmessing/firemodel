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

describe("Record > ", () => {
  let db: DB;
  beforeEach(() => {
    db = new DB({ mocking: true });
    db.resetMockDb();
    db.mock
      .addSchema("person", h => () => ({
        name: h.faker.name.firstName(),
        age: h.faker.random.number({ min: 1, max: 99 })
      }))
      .pathPrefix("authenticated");
  });

  it("using pushKey works", async () => {
    db.set<Person>("/authenticated/people/1234", {
      name: "Bart Simpson",
      age: 10
    });
    const People = new Model<Person>(Person, db);
    // const People = Model.create(Person, { db });
    let bart = await People.getRecord("1234");
    await bart.pushKey("tags", "doh!");
    bart = await People.getRecord("1234");
    const first = helpers.firstKey(bart.data.tags);
    expect(bart.data.tags[first]).to.equal("doh!");
  });

  it.skip("using pushKey updates lastUpdated", async () => {
    db.set<Person>("/authenticated/people/1234", {
      name: "Bart Simpson",
      age: 10
    });
    const People = new Model<Person>(Person, db);
    let bart = await People.getRecord("1234");
    const backThen = bart.data.createdAt;
    expect(bart.data.lastUpdated).to.equal(backThen);
    await bart.pushKey("tags", "doh!");
    bart = await People.getRecord("1234");
    const first = helpers.firstKey(bart.data.tags);
    expect(bart.data.tags[first]).to.equal("doh!");
    expect(bart.data.lastUpdated).to.not.equal(backThen);
    expect(bart.data.createdAt).to.equal(backThen);
  });

  it.skip("calling dbPath() before the ID is known provides useful error", async () => {
    const record = Record.create(Person, { db });

    try {
      const foo = record.dbPath;
      throw new Error("Error should have happened");
    } catch (e) {
      expect(e.code).to.equal("record/invalid-path");
      expect(e.message).contains("Invalid Record Path");
    }
  });

  it("State of Model's Schema class is not changed due to record information coming in", async () => {
    const record = Record.create(Person, { db });
    const record2 = Record.create(Person, { db });
    expect(record.data).to.not.equal(record2.data);
    expect(record.get("age")).to.equal(undefined);
    expect(record2.get("age")).to.equal(undefined);
    record.initialize({
      name: "Bob",
      age: 12,
      fuckwit: "yup"
    });
    expect(record.get("age")).to.equal(12);
    const record3 = Record.create(Person, { db });
    console.log(record3.get("fuckwit"));

    expect(record3.get("age")).to.equal(undefined);
    expect(record2.get("age")).to.equal(undefined);
    expect(record.get("name")).to.equal("Bob");
    expect(record2.get("name")).to.equal(undefined);
  });
});
