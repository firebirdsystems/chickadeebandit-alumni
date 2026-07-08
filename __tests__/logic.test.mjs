import { describe, test, expect } from "vitest";
import { testPrivilegedGateContract } from "./helpers/privileged-gate.mjs";
import { isLeadership, filterRoster } from "../src/logic.js";

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

describe("filterRoster", () => {
  const roster = [
    { member_name: "Dana Lee", grad_year: "2016", city: "Austin", employer: "Acme", job_title: "PM", bio: "" },
    { member_name: "Sam Ortiz", grad_year: "2011", city: "Denver", employer: "Globex", job_title: "Eng", bio: "climber" },
  ];
  test("empty query returns all", () => {
    expect(filterRoster(roster, "").length).toBe(2);
  });
  test("matches across fields", () => {
    expect(filterRoster(roster, "denver").map((p) => p.member_name)).toEqual(["Sam Ortiz"]);
    expect(filterRoster(roster, "acme").map((p) => p.member_name)).toEqual(["Dana Lee"]);
    expect(filterRoster(roster, "climber").map((p) => p.member_name)).toEqual(["Sam Ortiz"]);
  });
  test("no match returns empty", () => {
    expect(filterRoster(roster, "zzz").length).toBe(0);
  });
});
