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

/**
 * The line a failed write shows. "Try again" only where trying again can work:
 * a refusal or a row that is gone says what happened instead. `gone` is the
 * caller's re-read after a plain `WHERE id = ?` write that changed nothing
 * (true: no row; false: the row is there, so the row policy refused it;
 * undefined: the re-read failed, so nothing is known). Without it a 404 is
 * "removed" and a 409 "changed by someone else". Never the hub's text.
 */
export function failureLine(e, { action, thing, gone } = {}) {
  if (gone === true) return `This ${thing} has been removed.`;
  if (gone === false) return `You don’t have permission to ${action}.`;
  if (e?.code === "UNIQUE_CONSTRAINT" || /UNIQUE constraint failed/i.test(e?.message ?? "")) return `That ${thing} already exists.`;
  if (e?.status === 403) return `You don’t have permission to ${action}.`;
  if (e?.status === 507) return "The household’s storage is full — free up space first.";
  if (e?.status === 404) return `This ${thing} has been removed.`;
  if (e?.status === 409) return `This ${thing} was changed by someone else — check it first.`;
  return `Couldn’t ${action} — try again.`;
}

/**
 * Whether a failed write may still have been stored: no answer, a 2xx whose
 * body could not be read, the hub's 400 for a write that timed out, or a 5xx
 * other than storage full. Then the page reads the row back by its pinned id
 * before saying anything.
 */
export function outcomeUnknown(e) {
  const status = Number(e?.status) || 0;
  return status === 0 || (status >= 200 && status < 300) || status === 400 || (status >= 500 && status !== 507);
}

/**
 * Whether a stored row differs from what the form holds now, over the form's
 * own fields only, compared as text with a missing value as empty.
 */
export function storedDiffers(row, fields) {
  return Object.keys(fields).some((k) => String(row?.[k] ?? "") !== String(fields[k] ?? ""));
}
