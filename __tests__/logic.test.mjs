import { describe, test, expect } from "vitest";
import { testPrivilegedGateContract } from "./helpers/privileged-gate.mjs";
import { isLeadership, searchableFields, sortRoster, failureLine, outcomeUnknown, storedDiffers } from "../src/logic.js";

// The isLeadership gate fronts the profiles write_owner_only + privileged_groups
// policy, so it must satisfy the shared privileged-gate contract (no adult
// fallback when the group is unconfigured or dangling).
const GROUPS = [{ id: "g-lead", name: "Leadership", memberIds: ["m-in"] }];
testPrivilegedGateContract("isLeadership", isLeadership, {
  member: { id: "m-in", role: "adult" },
  outsider: { id: "m-out", role: "adult" },
  groups: GROUPS,
  groupId: "g-lead",
});

describe("searchableFields", () => {
  const sam = { member_name: "Sam Ortiz", grad_year: "2004", city: "Denver", employer: "Acme", job_title: "Engineer", bio: "avid climber" };

  it("reaches past the name into city, employer and bio", () => {
    const fields = searchableFields(sam);
    expect(fields).toContain("Denver");
    expect(fields).toContain("Acme");
    expect(fields).toContain("avid climber");
  });

  it("includes the grad year, which people search by", () => {
    expect(searchableFields(sam)).toContain("2004");
  });
});

// The roster's real ordering lives here, not in SQL: member_name is encrypted
// at rest, so the statement can only order by grad_year and the names are
// alphabetisable once decrypted. These cases are what the dropped SQL terms
// used to promise.
describe("sortRoster", () => {
  const order = (rows) => sortRoster(rows).map((r) => r.member_name);

  it("puts the newest class first", () => {
    expect(order([
      { grad_year: "2009", member_name: "A" },
      { grad_year: "2021", member_name: "B" },
      { grad_year: "1998", member_name: "C" },
    ])).toEqual(["B", "A", "C"]);
  });

  it("alphabetises within a class year", () => {
    expect(order([
      { grad_year: "2014", member_name: "Priya Shah" },
      { grad_year: "2014", member_name: "Alex Rivera" },
      { grad_year: "2014", member_name: "Mo Khan" },
    ])).toEqual(["Alex Rivera", "Mo Khan", "Priya Shah"]);
  });

  // Matches ORDER BY grad_year DESC, which the app relies on to avoid a
  // leading (grad_year = '') expression that no index can serve.
  it("sorts alumni with no grad year to the end, still alphabetised", () => {
    expect(order([
      { grad_year: "", member_name: "Zoe" },
      { grad_year: "2004", member_name: "Sam" },
      { member_name: "Ada" },
    ])).toEqual(["Sam", "Ada", "Zoe"]);
  });
});

describe("failureLine", () => {
  const err = (props) => Object.assign(new Error("hub text that never reaches the screen"), props);
  const opts = { action: "save the profile", thing: "profile" };
  test("a duplicate already exists, by code or by the hub's text", () => {
    expect(failureLine(err({ status: 400, code: "UNIQUE_CONSTRAINT" }), opts)).toBe("That profile already exists.");
    expect(failureLine(new Error("UNIQUE constraint failed: x.id"), opts)).toBe("That profile already exists.");
  });
  test("a 403 is not allowed", () => {
    expect(failureLine(err({ status: 403 }), opts)).toBe("You don’t have permission to save the profile.");
  });
  test("a 507 is storage full", () => {
    expect(failureLine(err({ status: 507 }), opts)).toBe("The household’s storage is full — free up space first.");
  });
  test("removed for a 404, or when the re-read found no row", () => {
    expect(failureLine(err({ status: 404 }), opts)).toBe("This profile has been removed.");
    expect(failureLine(null, { ...opts, gone: true })).toBe("This profile has been removed.");
  });
  test("changed by someone else for a 409", () => {
    expect(failureLine(err({ status: 409 }), opts)).toBe("This profile was changed by someone else — check it first.");
  });
  test("a plain write that changed nothing while the row is still there was refused", () => {
    expect(failureLine(null, { ...opts, gone: false })).toBe("You don’t have permission to save the profile.");
  });
  test("a write that changed nothing and a failed re-read: try again, neither removed nor changed", () => {
    expect(failureLine(null, { ...opts, gone: undefined })).toBe("Couldn’t save the profile — try again.");
  });
  test("try again when no answer came, the hub failed, or any other 400", () => {
    for (const e of [new TypeError("Failed to fetch"), err({ status: 500 }), err({ status: 503 }), err({ status: 400 })]) {
      expect(failureLine(e, opts)).toBe("Couldn’t save the profile — try again.");
    }
  });
});

describe("outcomeUnknown", () => {
  test("no answer, an unreadable 2xx, a 400 or a 5xx other than 507 may have been stored", () => {
    for (const e of [new TypeError("Failed to fetch"), { status: 200 }, { status: 400 }, { status: 500 }, { status: 503 }]) {
      expect(outcomeUnknown(e)).toBe(true);
    }
  });
  test("a refusal the hub named is known", () => {
    for (const status of [403, 404, 409, 507]) expect(outcomeUnknown({ status })).toBe(false);
  });
});

describe("storedDiffers", () => {
  const fields = { grad_year: "2014", city: "Chicago", email: "" };
  test("same values, with null and empty alike and extra stored columns ignored", () => {
    expect(storedDiffers({ grad_year: 2014, city: "Chicago", email: null, id: "p1" }, fields)).toBe(false);
  });
  test("an edited field differs", () => {
    expect(storedDiffers({ grad_year: "2014", city: "Denver", email: "" }, fields)).toBe(true);
  });
});
