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

/**
 * Fields the in-app search matches against (see hub-sdk `searchMatch`). Covers
 * every field the roster card shows, so an alum is findable by where they live
 * or who they work for, not just by name.
 */
export function searchableFields(profile) {
  return [
    profile.member_name,
    profile.grad_year,
    profile.city,
    profile.employer,
    profile.job_title,
    profile.bio,
  ];
}
