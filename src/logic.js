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

/**
 * Roster order: newest class first, then alphabetical within a class.
 *
 * The SQL deliberately orders by grad_year alone. `member_name` is encrypted at
 * rest — only `grad_year` is declared in db_plaintext_columns — so an SQL
 * `ORDER BY member_name` sorts ciphertext: it looks alphabetical, produces an
 * arbitrary order, and costs a full-table sort to do it. The names are only
 * alphabetisable once the hub has decrypted them, which is here.
 *
 * Blank grad years sort last, matching what `ORDER BY grad_year DESC` gives —
 * '' is the minimum TEXT value, so descending already puts it at the end.
 *
 * Sorts in place and returns the same array.
 *
 * @param {Array<{grad_year?: string, member_name?: string}>} profiles
 */
export function sortRoster(profiles) {
  return profiles.sort(
    (a, b) =>
      String(b.grad_year || "").localeCompare(String(a.grad_year || "")) ||
      String(a.member_name || "").localeCompare(String(b.member_name || "")),
  );
}
