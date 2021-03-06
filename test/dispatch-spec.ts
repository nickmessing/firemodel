// tslint:disable:no-implicit-dependencies
import { Record } from "../src";
import * as chai from "chai";
import { Person } from "./testing/person";
import { IMultiPathUpdates, FireModel } from "../src/FireModel";
import {
  FMEvents,
  IFMRecordClientEvent,
  IFMRelationshipEvent,
  IFMRecordEvent
} from "../src/state-mgmt";
import { DB } from "abstracted-admin";
import { wait } from "./testing/helpers";
import { IVuexDispatch, VeuxWrapper } from "../src/VuexWrapper";
const expect = chai.expect;

describe("Dispatch →", () => {
  let db: DB;
  beforeEach(async () => {
    db = new DB({ mocking: true });
    await db.waitForConnection();
    Record.defaultDb = db;
    Record.dispatch = null;
  });
  it("_getPaths() decomposes the update into an array of discrete update paths", async () => {
    const person = Record.create(Person);
    (person as any)._data.id = "12345"; // cheating a bit here
    const lastUpdated = new Date().getTime();
    const updated = {
      name: "Roger Rabbit",
      lastUpdated
    };
    const result: IMultiPathUpdates[] = (person as any)._getPaths(updated);

    // expect(result.length).to.equal(2);
    result.map(i => {
      expect(i).to.haveOwnProperty("path");
      expect(i).to.haveOwnProperty("value");
      if (i.path.indexOf("lastUpdated") !== -1) {
        expect(i.value).to.equal(lastUpdated);
      } else {
        expect(i.value).to.equal("Roger Rabbit");
      }
    });
  });

  it("_createRecordEvent() produces correctly formed Redux event", async () => {
    const person = Record.create(Person);
    (person as any)._data.id = "12345"; // cheating a bit here
    const lastUpdated = new Date().getTime();
    const updated = {
      name: "Roger Rabbit",
      lastUpdated
    };
    const paths: IMultiPathUpdates[] = (person as any)._getPaths(updated);
    const event: IFMRecordClientEvent<
      Person
    > = (person as any)._createRecordEvent(
      person,
      FMEvents.RECORD_CHANGED_LOCALLY,
      paths
    );
    expect(event).is.an("object");
    expect(event.type).to.equal(FMEvents.RECORD_CHANGED_LOCALLY);
    expect(event.dbPath).to.equal(`authenticated/people/12345`);
    expect(event.paths).to.equal(paths);
    expect(event.paths).to.have.lengthOf(2);

    expect(event.model).to.equal("person");
  });

  it("set() immediately changes value on Record", async () => {
    const person = await Record.add(Person, {
      name: "Jane",
      age: 18
    });

    person.set("name", "Carol");
    // expect(person.isDirty).to.equal(true);
    expect(person.get("name")).to.equal("Carol");
    await wait(15);
    expect(person.isDirty).to.equal(false);
  });

  it("waiting for set() fires the appropriate Redux event; and inProgress is set", async () => {
    const events: Array<IFMRecordEvent<Person>> = [];
    const person = await Record.add(Person, {
      name: "Jane",
      age: 18
    });
    Record.dispatch = (e: IFMRecordEvent<Person>) => events.push(e);

    await person.set("name", "Carol");
    expect(person.get("name")).to.equal("Carol"); // local change took place
    expect(events.length).to.equal(2); // two phase commit
    expect(person.isDirty).to.equal(false); // value already back to false

    // 1st EVENT (local change)
    let event = events[0];
    expect(event.type).to.equal(FMEvents.RECORD_CHANGED_LOCALLY);
    expect(event.paths).to.have.lengthOf(2);
    event.paths.map(p => {
      switch (p.path.replace(/^\//, "")) {
        case "name":
          expect(p.value).to.equal("Carol");
          break;
        case "lastUpdated":
          expect(p.value)
            .to.be.a("number")
            .and.lessThan(new Date().getTime());
          break;
        default:
          throw new Error(`Unexpected property path [ ${p.path} ] on set()`);
      }
    });
    // 2nd EVENT
    event = events[1];
    expect(event.type).to.equal(FMEvents.RECORD_CHANGED);
    expect(event.paths).to.be.a("undefined");
    expect(event.value).to.be.an("object");
    expect(event.value.name).to.equal("Carol");
    expect(event.value.age).to.equal(18);
  });

  it("VuexWrapper converts calling structure to what Vuex expects", async () => {
    const events: Array<IFMRecordEvent<Person>> = [];
    const types = new Set<string>();
    const vueDispatch: IVuexDispatch = (type, payload: any) => {
      types.add(type);
      events.push({ ...payload, ...{ type } });
    };
    const person = await Record.add(Person, {
      name: "Jane",
      age: 18
    });
    Record.dispatch = VeuxWrapper(vueDispatch);
    await person.update({
      age: 12
    });
    await person.update({
      age: 25
    });
    expect(events).to.have.lengthOf(4);
    expect(types.size).to.equal(2);
  });
});
