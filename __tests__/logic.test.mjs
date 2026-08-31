import { describe, test, expect } from "vitest";
import { testPrivilegedGateContract } from "./helpers/privileged-gate.mjs";
import { isLeadership, searchableFields, sortRoster } from "../src/logic.js";

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
