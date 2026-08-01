import { describe, test, expect } from "vitest";
import { testPrivilegedGateContract } from "./helpers/privileged-gate.mjs";
import { isLeadership, searchableFields } from "../src/logic.js";

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
