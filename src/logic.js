// Pure, browser-free logic for the Alumni Network app — unit-tested in
// __tests__/logic.test.mjs.

/**
 * Client gate for "may this member manage the whole roster" (edit/remove any
 * alum profile — the front of the `profiles` write_owner_only +
 * privileged_groups policy). Mirrors the hub's `memberInAppGroupSetting`
 * EXACTLY: privileged IFF a leadership group is configured, still exists, and
 * the member belongs to it. There is deliberately NO "all adults" fallback —
 * when the group is unset, the hub grants no bypass, so neither may the client.
 *
 * @param {{id: string}|null} member
 * @param {Array<{id: string, memberIds?: string[]}>} groups
 * @param {string|null} groupId  configured leadership_group_id
 */
export function isLeadership(member, groups, groupId) {
  if (!member || !member.id || !groupId) return false;
  const group = (groups || []).find((g) => g.id === groupId);
  return !!group && Array.isArray(group.memberIds) && group.memberIds.includes(member.id);
}

/** Filter a roster by a free-text query across the visible profile fields. */
export function filterRoster(profiles, query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return profiles;
  return profiles.filter((p) => {
    const hay = [p.member_name, p.grad_year, p.city, p.employer, p.job_title, p.bio]
      .filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q);
  });
}
